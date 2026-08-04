import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const TIPOS = [
  { valor: 'perguntas_respostas', label: 'Perguntas e respostas' },
  { valor: 'interpretacao_texto', label: 'Interpretação de texto' },
  { valor: 'criar_perguntas', label: 'Criar perguntas (a partir de respostas)' },
]

export function CriarExercicio({ turmas, nivelFixo, licaoFixa, exercicioEditando, onCancelarEdicao, onCriado }) {
  const { session } = useAuth()
  const [tipo, setTipo] = useState('perguntas_respostas')
  const [titulo, setTitulo] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [prazo, setPrazo] = useState('')
  const [texto, setTexto] = useState('')
  const [itens, setItens] = useState([{ id: cryptoId(), valor: '' }])
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  function cryptoId() { return Math.random().toString(36).slice(2, 9) }

  useEffect(() => {
    if (!exercicioEditando) return
    setTipo(exercicioEditando.tipo)
    setTitulo(exercicioEditando.titulo)
    setTurmaId(exercicioEditando.turma_id || '')
    setPrazo(exercicioEditando.prazo || '')
    setTexto(exercicioEditando.conteudo?.texto || '')
    const listaBase =
      exercicioEditando.tipo === 'criar_perguntas'
        ? exercicioEditando.conteudo?.respostas
        : exercicioEditando.conteudo?.perguntas
    setItens((listaBase || []).map((i) => ({ id: i.id || cryptoId(), valor: i.pergunta ?? i.resposta ?? '' })))
  }, [exercicioEditando])

  function limpar() {
    setTipo('perguntas_respostas'); setTitulo(''); setTurmaId(''); setPrazo('')
    setTexto(''); setItens([{ id: cryptoId(), valor: '' }])
  }

  function addItem() { setItens((prev) => [...prev, { id: cryptoId(), valor: '' }]) }
  function atualizarItem(id, valor) { setItens((prev) => prev.map((i) => (i.id === id ? { ...i, valor } : i))) }
  function removerItem(id) { if (itens.length > 1) setItens((prev) => prev.filter((i) => i.id !== id)) }

  async function handleSubmit(e) {
    e.preventDefault()
    setMensagem(null)

    const itensLimpos = itens.map((i) => ({ id: i.id, valor: i.valor.trim() })).filter((i) => i.valor)
    if (itensLimpos.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Adicione pelo menos um item.' })
      return
    }

    let conteudo
    if (tipo === 'criar_perguntas') {
      conteudo = { respostas: itensLimpos.map((i) => ({ id: i.id, resposta: i.valor })) }
    } else if (tipo === 'interpretacao_texto') {
      if (!texto.trim()) {
        setMensagem({ tipo: 'erro', texto: 'Cole o texto de interpretação.' })
        return
      }
      conteudo = { texto: texto.trim(), perguntas: itensLimpos.map((i) => ({ id: i.id, pergunta: i.valor })) }
    } else {
      conteudo = { perguntas: itensLimpos.map((i) => ({ id: i.id, pergunta: i.valor })) }
    }

    setSalvando(true)

    if (exercicioEditando) {
      const { error } = await supabase.from('exercicios').update({
        tipo, titulo, turma_id: turmaId || null, prazo: prazo || null, conteudo,
      }).eq('id', exercicioEditando.id)
      setSalvando(false)
      if (error) { setMensagem({ tipo: 'erro', texto: `Erro: ${error.message}` }); return }
      setMensagem({ tipo: 'sucesso', texto: 'Exercício atualizado!' })
      limpar()
      onCriado?.()
      return
    }

    const { count } = await supabase.from('exercicios').select('id', { count: 'exact', head: true })
      .eq('nivel', nivelFixo).eq('licao', licaoFixa)

    const { error } = await supabase.from('exercicios').insert({
      tipo, nivel: nivelFixo, licao: licaoFixa, turma_id: turmaId || null,
      titulo, conteudo, gabarito: null, prazo: prazo || null, publicado: true,
      criado_por: session.user.id, ordem: (count || 0) + 1,
    })
    setSalvando(false)
    if (error) { setMensagem({ tipo: 'erro', texto: `Erro ao salvar: ${error.message}` }); return }
    setMensagem({ tipo: 'sucesso', texto: 'Exercício publicado!' })
    limpar()
    onCriado?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">
          {exercicioEditando ? 'Editar exercício' : 'Criar exercício'}
        </h2>
        {exercicioEditando && (
          <button type="button" onClick={() => { limpar(); onCancelarEdicao?.() }} className="text-xs text-ink-soft hover:text-ink transition">Cancelar edição</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber">
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Turma (opcional)</label>
          <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber">
            <option value="">Todas as turmas do nível</option>
            {turmas.filter((t) => t.nivel === nivelFixo).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Título</label>
        <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" placeholder="Ex: Present Simple — prática" />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Prazo (opcional — vira tarefa de casa)</label>
        <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
      </div>

      {tipo === 'interpretacao_texto' && (
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Texto para interpretação</label>
          <textarea required value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-medium text-ink-soft uppercase tracking-wide">
          {tipo === 'criar_perguntas' ? 'Respostas (o aluno escreve a pergunta)' : 'Perguntas'}
        </label>
        {itens.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-xs text-ink-faint font-mono w-5">{i + 1}.</span>
            <input value={item.valor} onChange={(e) => atualizarItem(item.id, e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber"
              placeholder={tipo === 'criar_perguntas' ? 'Ex: I study English.' : 'Ex: Do you study English?'} />
            {itens.length > 1 && (
              <button type="button" onClick={() => removerItem(item.id)} className="text-ink-soft hover:text-red-500 transition">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addItem} className="text-xs text-navy underline decoration-amber decoration-2 underline-offset-2">+ adicionar item</button>
      </div>

      {mensagem && (
        <p className={`text-sm px-3 py-2 rounded-lg ${mensagem.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-teal-soft text-teal'}`}>{mensagem.texto}</p>
      )}

      <button type="submit" disabled={salvando} className="pressionavel bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-deep disabled:opacity-50 transition">
        {salvando ? 'Salvando...' : exercicioEditando ? 'Salvar alterações' : 'Publicar exercício'}
      </button>
    </form>
  )
}
