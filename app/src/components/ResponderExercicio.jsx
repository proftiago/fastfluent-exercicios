import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function ResponderExercicio({ exercicio, clienteId, onEnviado, onCancelar }) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const itensBase =
    exercicio.tipo === 'criar_perguntas'
      ? exercicio.conteudo.respostas
      : exercicio.conteudo.perguntas

  const [respostas, setRespostas] = useState(
    Object.fromEntries(itensBase.map((item) => [item.id, '']))
  )

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    const itens = itensBase.map((item) => ({ id: item.id, texto: (respostas[item.id] || '').trim() }))
    if (itens.some((i) => !i.texto)) {
      setErro('Responda todos os campos antes de enviar.')
      return
    }
    setEnviando(true)
    const { error } = await supabase.from('tentativas').insert({
      exercicio_id: exercicio.id,
      cliente_id: clienteId,
      resposta: { itens },
    })
    setEnviando(false)
    if (error) {
      setErro(`Erro ao enviar: ${error.message}`)
      return
    }

    fetch('https://kockwinynfpaenxmzagu.supabase.co/functions/v1/notificar-professor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercicio_id: exercicio.id, cliente_id: clienteId }),
    }).catch(() => {})

    let atividade = null
    try {
      const { data } = await supabase.rpc('registrar_atividade_aluno', { p_cliente_id: clienteId })
      atividade = Array.isArray(data) ? data[0] : data
    } catch (e) {
      console.error(e)
    }

    onEnviado?.(atividade)
  }

  return (
    <form onSubmit={enviar} className="bg-surface rounded-2xl border border-line p-6 space-y-4">
      <h3 className="font-display text-base font-semibold text-ink">{exercicio.titulo}</h3>
      {exercicio.tipo === 'interpretacao_texto' && (
        <div className="bg-paper rounded-lg p-4 text-sm text-ink whitespace-pre-wrap">
          {exercicio.conteudo.texto}
        </div>
      )}
      {exercicio.tipo === 'criar_perguntas' && (
        <p className="text-sm text-ink-soft">Escreva a pergunta correspondente a cada resposta abaixo.</p>
      )}
      <div className="space-y-3">
        {itensBase.map((item, i) => (
          <div key={item.id}>
            <label className="block text-sm font-medium text-ink mb-1">
              {i + 1}. {exercicio.tipo === 'criar_perguntas' ? item.resposta : item.pergunta}
            </label>
            <textarea
              value={respostas[item.id]}
              onChange={(e) => setRespostas((prev) => ({ ...prev, [item.id]: e.target.value }))}
              rows={exercicio.tipo === 'criar_perguntas' ? 1 : 2}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber"
              placeholder={exercicio.tipo === 'criar_perguntas' ? 'Sua pergunta...' : 'Sua resposta...'}
            />
          </div>
        ))}
      </div>
      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="pressionavel bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-deep disabled:opacity-50 transition">
          {enviando ? 'Enviando...' : 'Enviar respostas'}
        </button>
        <button type="button" onClick={onCancelar} className="text-sm text-ink-soft px-3">Cancelar</button>
      </div>
    </form>
  )
}
