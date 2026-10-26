import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function CorrigirTentativa({ tentativa, exercicio, onCorrigido, onCancelar }) {
  const itensBase = exercicio.tipo === 'criar_perguntas' ? exercicio.conteudo.respostas : exercicio.conteudo.perguntas

  const [nota, setNota] = useState(tentativa.nota ?? '')
  const [feedback, setFeedback] = useState(tentativa.feedback ?? '')
  const [comentarios, setComentarios] = useState(
    Object.fromEntries(itensBase.map((item) => [
      item.id,
      tentativa.correcao_itens?.find((c) => c.id === item.id)?.comentario || '',
    ]))
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (nota === '' || isNaN(Number(nota))) {
      setErro('Please enter a valid grade.')
      return
    }
    setSalvando(true)

    const correcao_itens = itensBase.map((item) => ({ id: item.id, comentario: comentarios[item.id] || '' }))

    const { error } = await supabase
      .from('tentativas')
      .update({ nota: Number(nota), feedback, correcao_itens, status: 'corrigido_manual' })
      .eq('id', tentativa.id)

    setSalvando(false)
    if (error) { setErro(`Error saving: ${error.message}`); return }

    supabase.functions.invoke('notificar-aluno', { body: { tentativa_id: tentativa.id } }).catch(() => {})

    onCorrigido?.()
  }

  return (
    <form onSubmit={salvar} className="bg-surface rounded-2xl border border-line p-6 space-y-4">
      <h3 className="font-display text-base font-semibold text-ink">{exercicio.titulo}</h3>

      {exercicio.tipo === 'interpretacao_texto' && (
        <div className="bg-paper rounded-lg p-4 text-sm text-ink whitespace-pre-wrap">{exercicio.conteudo.texto}</div>
      )}

      <div className="space-y-3">
        {itensBase.map((item, i) => {
          const respostaAluno = tentativa.resposta?.itens?.find((x) => x.id === item.id)?.texto || '(no answer)'
          return (
            <div key={item.id} className="border border-line rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-ink-soft">
                {i + 1}. {exercicio.tipo === 'criar_perguntas' ? item.resposta : item.pergunta}
              </p>
              <p className="text-sm text-ink bg-paper rounded px-2 py-1.5">{respostaAluno}</p>
              <input
                value={comentarios[item.id]}
                onChange={(e) => setComentarios((prev) => ({ ...prev, [item.id]: e.target.value }))}
                placeholder="Comment on this item (optional)"
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-xs text-teal bg-teal-soft/40 focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
            </div>
          )
        })}
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Grade (0-10)</label>
        <input type="number" min="0" max="10" step="0.5" value={nota} onChange={(e) => setNota(e.target.value)}
          className="w-32 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">General feedback for the student</label>
        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={salvando} className="pressionavel bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-deep disabled:opacity-50 transition">
          {salvando ? 'Saving...' : 'Save Grading'}
        </button>
        <button type="button" onClick={onCancelar} className="text-sm text-ink-soft px-3">Cancel</button>
      </div>
    </form>
  )
}
