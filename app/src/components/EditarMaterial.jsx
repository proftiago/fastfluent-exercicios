import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Carregando } from './Carregando'
import {
  BookOpenText, Save, Plus, X, ChevronUp, ChevronDown, Eye, EyeOff,
  GraduationCap, Search, Loader2, Volume2, Check, Bell,
} from 'lucide-react'

const TIPOS_SECAO = [
  { valor: 'warmup', label: 'Warm Up' },
  { valor: 'vocabulario', label: 'Palavras novas' },
  { valor: 'curiosidades', label: 'Curiosidades' },
  { valor: 'structure', label: 'Structure (gramática)' },
  { valor: 'atividades', label: 'Atividades' },
  { valor: 'consolidacao', label: 'Consolidação' },
  { valor: 'outro', label: 'Outro' },
]

const PARTES_VOCAB = ['Liftoff', 'Stardust', 'Beacon']

function novoId() { return Math.random().toString(36).slice(2, 9) }

function novaParte(nome) {
  return { nome, itens: [], frases_repetir: [], perguntas_pratica: [], checkpoint: [], exercicio_vinculado_id: null }
}

function novoBloco(tipo = 'warmup') {
  return {
    id: novoId(),
    tipo,
    titulo: TIPOS_SECAO.find((t) => t.valor === tipo)?.label || '',
    visivel_aluno: true,
    visivel_professor: true,
    publicado: true,
    corpo: '',
    partes: tipo === 'vocabulario' ? [] : undefined,
  }
}

function falar(texto) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

function EditorParte({ parte, atualizar, nivel, licao }) {
  const [colarTexto, setColarTexto] = useState('')
  const [colarFrases, setColarFrases] = useState('')
  const [buscandoId, setBuscandoId] = useState(null)
  const [resultadosBusca, setResultadosBusca] = useState({})
  const [novaPergunta, setNovaPergunta] = useState('')
  const [novoCheck, setNovoCheck] = useState('')
  const [sincronizando, setSincronizando] = useState(false)

  function adicionarLinhas() {
    const linhas = colarTexto.split('\n').map((l) => l.trim()).filter(Boolean)
    if (linhas.length === 0) return
    const novosItens = linhas.map((texto) => ({ id: novoId(), texto, imagem_url: null }))
    atualizar({ ...parte, itens: [...parte.itens, ...novosItens] })
    setColarTexto('')
  }

  function removerItem(id) {
    atualizar({ ...parte, itens: parte.itens.filter((i) => i.id !== id) })
  }

  function editarTextoItem(id, texto) {
    atualizar({ ...parte, itens: parte.itens.map((i) => (i.id === id ? { ...i, texto } : i)) })
  }

  async function buscarImagem(item) {
    setBuscandoId(item.id)
    try {
      const resp = await fetch('https://kockwinynfpaenxmzagu.supabase.co/functions/v1/buscar-imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: item.texto }),
      })
      const dados = await resp.json()
      if (resp.ok) setResultadosBusca((prev) => ({ ...prev, [item.id]: dados.resultados || [] }))
    } catch (e) {
      console.error(e)
    } finally {
      setBuscandoId(null)
    }
  }

  function escolherImagem(itemId, url) {
    atualizar({ ...parte, itens: parte.itens.map((i) => (i.id === itemId ? { ...i, imagem_url: url } : i)) })
    setResultadosBusca((prev) => ({ ...prev, [itemId]: null }))
  }

  function adicionarFrases() {
    const linhas = colarFrases.split('\n').map((l) => l.trim()).filter(Boolean)
    if (linhas.length === 0) return
    const novasFrases = linhas.map((texto) => ({ id: novoId(), texto }))
    atualizar({ ...parte, frases_repetir: [...(parte.frases_repetir || []), ...novasFrases] })
    setColarFrases('')
  }
  function removerFrase(id) {
    atualizar({ ...parte, frases_repetir: (parte.frases_repetir || []).filter((f) => f.id !== id) })
  }

  function addPergunta() {
    if (!novaPergunta.trim()) return
    atualizar({ ...parte, perguntas_pratica: [...parte.perguntas_pratica, { id: novoId(), texto: novaPergunta.trim(), enviado_dever: false }] })
    setNovaPergunta('')
  }
  function removerPergunta(id) {
    atualizar({ ...parte, perguntas_pratica: parte.perguntas_pratica.filter((p) => p.id !== id) })
  }

  function addCheck() {
    if (!novoCheck.trim()) return
    atualizar({ ...parte, checkpoint: [...parte.checkpoint, { id: novoId(), texto: novoCheck.trim() }] })
    setNovoCheck('')
  }
  function removerCheck(id) {
    atualizar({ ...parte, checkpoint: parte.checkpoint.filter((c) => c.id !== id) })
  }

  async function alternarEnviado(perguntaId) {
    const novasPerguntas = parte.perguntas_pratica.map((p) =>
      p.id === perguntaId ? { ...p, enviado_dever: !p.enviado_dever } : p
    )
    let parteAtualizada = { ...parte, perguntas_pratica: novasPerguntas }
    atualizar(parteAtualizada)
    setSincronizando(true)

    const marcadas = novasPerguntas.filter((p) => p.enviado_dever)
    const conteudoExercicio = { perguntas: marcadas.map((p) => ({ id: p.id, pergunta: p.texto })) }

    try {
      if (parte.exercicio_vinculado_id) {
        await supabase.from('exercicios').update({ conteudo: conteudoExercicio }).eq('id', parte.exercicio_vinculado_id)
      } else if (marcadas.length > 0) {
        const { data: sessao } = await supabase.auth.getUser()
        const { count } = await supabase.from('exercicios').select('id', { count: 'exact', head: true }).eq('nivel', nivel).eq('licao', licao)
        const { data, error } = await supabase.from('exercicios').insert({
          tipo: 'perguntas_respostas', nivel, licao,
          titulo: `${parte.nome} — prática`,
          conteudo: conteudoExercicio, gabarito: null, publicado: true,
          criado_por: sessao?.user?.id, ordem: (count || 0) + 1,
        }).select().single()
        if (!error && data) {
          parteAtualizada = { ...parteAtualizada, exercicio_vinculado_id: data.id }
          atualizar(parteAtualizada)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <div className="border border-line rounded-lg p-3 space-y-4 bg-paper/40">
      <p className="text-xs font-semibold text-amber uppercase tracking-wide">{parte.nome}</p>

      <div className="space-y-2">
        <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide">Palavras / frases</label>
        <div className="flex gap-2">
          <textarea value={colarTexto} onChange={(e) => setColarTexto(e.target.value)} rows={2}
            className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-amber/50"
            placeholder={'Cole uma lista, uma por linha:\nI\nYou\nTo want'} />
          <button type="button" onClick={adicionarLinhas} className="shrink-0 text-xs font-medium bg-navy text-white px-3 rounded-lg hover:bg-navy-deep transition">Adicionar</button>
        </div>

        {(parte.itens || []).map((item) => (
          <div key={item.id} className="flex items-start gap-2 bg-surface border border-line rounded-lg p-2 relative">
            <button type="button" onClick={() => falar(item.texto)} className="text-navy shrink-0 mt-1"><Volume2 size={14} /></button>
            <input value={item.texto} onChange={(e) => editarTextoItem(item.id, e.target.value)}
              className="flex-1 border-none text-sm text-ink focus:outline-none bg-transparent" />
            {item.imagem_url ? (
              <img src={item.imagem_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
            ) : (
              <button type="button" onClick={() => buscarImagem(item)} disabled={buscandoId === item.id}
                className="shrink-0 flex items-center gap-1 text-[11px] text-navy bg-paper px-2 py-1 rounded-lg">
                {buscandoId === item.id ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />} imagem
              </button>
            )}
            <button type="button" onClick={() => removerItem(item.id)} className="text-ink-soft hover:text-red-500 shrink-0 mt-1"><X size={14} /></button>

            {resultadosBusca[item.id]?.length > 0 && (
              <div className="absolute top-full left-8 mt-1 bg-surface border border-line rounded-lg shadow-card p-2 flex gap-1.5 z-10">
                {resultadosBusca[item.id].map((r, i) => (
                  <button key={i} type="button" onClick={() => escolherImagem(item.id, r.full)}>
                    <img src={r.thumb} alt="" className="w-14 h-14 rounded object-cover hover:ring-2 hover:ring-amber" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide">Frases para repetir (aquecimento, antes das perguntas)</label>
        <div className="flex gap-2">
          <textarea value={colarFrases} onChange={(e) => setColarFrases(e.target.value)} rows={2}
            className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-amber/50"
            placeholder={'Cole uma lista, uma por linha:\nI want to work/ speak/ study.\nI speak Portuguese/ English/ Spanish.'} />
          <button type="button" onClick={adicionarFrases} className="shrink-0 text-xs font-medium bg-navy text-white px-3 rounded-lg hover:bg-navy-deep transition">Adicionar</button>
        </div>
        {(parte.frases_repetir || []).map((frase) => (
          <div key={frase.id} className="flex items-center gap-2 bg-surface border border-line rounded-lg p-2">
            <button type="button" onClick={() => falar(frase.texto)} className="text-navy shrink-0"><Volume2 size={14} /></button>
            <span className="flex-1 text-sm text-ink">{frase.texto}</span>
            <button type="button" onClick={() => removerFrase(frase.id)} className="text-ink-soft hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide">Perguntas de prática</label>
          <span className="text-[10px] text-ink-soft flex items-center gap-1">
            {sincronizando && <Loader2 size={10} className="animate-spin" />} marque pra já virar dever de casa
          </span>
        </div>
        {(parte.perguntas_pratica || []).map((p) => (
          <label key={p.id} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!p.enviado_dever} onChange={() => alternarEnviado(p.id)} className="shrink-0 w-4 h-4 accent-teal" />
            <span className={`flex-1 text-sm rounded-lg px-2.5 py-1.5 border ${p.enviado_dever ? 'bg-teal-soft text-teal border-teal/30' : 'bg-surface text-ink border-line'}`}>{p.texto}</span>
            <button type="button" onClick={(e) => { e.preventDefault(); removerPergunta(p.id) }} className="text-ink-soft hover:text-red-500"><X size={14} /></button>
          </label>
        ))}
        <div className="flex gap-2">
          <input value={novaPergunta} onChange={(e) => setNovaPergunta(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPergunta() } }}
            className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50"
            placeholder="Ex: Do you study English in the morning?" />
          <button type="button" onClick={addPergunta} className="shrink-0 text-navy"><Plus size={16} /></button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-wide">Checkpoint (lembrete só pro professor)</label>
        {(parte.checkpoint || []).map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-ink bg-amber-soft rounded-lg px-2.5 py-1.5">{c.texto}</span>
            <button type="button" onClick={() => removerCheck(c.id)} className="text-ink-soft hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={novoCheck} onChange={(e) => setNovoCheck(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCheck() } }}
            className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50"
            placeholder="Ex: Alunos pronunciaram corretamente?" />
          <button type="button" onClick={addCheck} className="shrink-0 text-navy"><Plus size={16} /></button>
        </div>
      </div>
    </div>
  )
}

export function EditarMaterial({ nivel, licao }) {
  const { session } = useAuth()
  const [tituloMaterial, setTituloMaterial] = useState('')
  const [blocos, setBlocos] = useState([])
  const [existente, setExistente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [statusSalvamento, setStatusSalvamento] = useState('idle')
  const [mensagem, setMensagem] = useState(null)
  const [notificando, setNotificando] = useState(false)
  const [notificado, setNotificado] = useState(false)
  const primeiraCarga = useRef(true)
  const timerAutosave = useRef(null)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await supabase.from('materiais_aula').select('*').eq('nivel', nivel).eq('licao', licao).maybeSingle()
      if (data) {
        setExistente(data)
        setTituloMaterial(data.titulo)
        const blocosBrutos = data.conteudo?.blocos?.length ? data.conteudo.blocos : []
        const blocosNormalizados = blocosBrutos.map((b) => {
          const publicado = true
          if (b.tipo !== 'vocabulario') return { ...b, publicado }
          const partesNormalizadas = (b.partes || []).map((p) => ({
            nome: p.nome,
            itens: p.itens || (p.texto ? [{ id: novoId(), texto: p.texto, imagem_url: null }] : []),
            frases_repetir: p.frases_repetir || [],
            perguntas_pratica: (p.perguntas_pratica || []).map((q) => ({ enviado_dever: false, ...q })),
            checkpoint: p.checkpoint || [],
            exercicio_vinculado_id: p.exercicio_vinculado_id || null,
          }))
          return { ...b, publicado, partes: partesNormalizadas }
        })
        setBlocos(blocosNormalizados)
      } else {
        setExistente(null); setTituloMaterial(''); setBlocos([])
      }
      setCarregando(false)
      primeiraCarga.current = true
    }
    carregar()
  }, [nivel, licao])

  useEffect(() => {
    if (carregando) return
    if (primeiraCarga.current) { primeiraCarga.current = false; return }
    if (!tituloMaterial.trim()) return

    setStatusSalvamento('salvando')
    if (timerAutosave.current) clearTimeout(timerAutosave.current)
    timerAutosave.current = setTimeout(async () => {
      const { error } = await persistirAgora(blocos)
      setStatusSalvamento(error ? 'idle' : 'salvo')
      if (error) setMensagem({ tipo: 'erro', texto: `Erro ao salvar automaticamente: ${error}` })
    }, 1200)

    return () => { if (timerAutosave.current) clearTimeout(timerAutosave.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocos, tituloMaterial])

  function atualizarBloco(id, campo, valor) {
    setBlocos((prev) => prev.map((b) => (b.id === id ? { ...b, [campo]: valor } : b)))
  }

  function alternarParteVocab(blocoId, nome) {
    setBlocos((prev) => prev.map((b) => {
      if (b.id !== blocoId) return b
      const existe = (b.partes || []).some((p) => p.nome === nome)
      const partes = existe ? b.partes.filter((p) => p.nome !== nome) : [...(b.partes || []), novaParte(nome)]
      return { ...b, partes }
    }))
  }

  function atualizarParte(blocoId, nome, parteAtualizada) {
    setBlocos((prev) => prev.map((b) => {
      if (b.id !== blocoId) return b
      return { ...b, partes: b.partes.map((p) => (p.nome === nome ? parteAtualizada : p)) }
    }))
  }

  function mover(index, direcao) {
    setBlocos((prev) => {
      const alvo = index + direcao
      if (alvo < 0 || alvo >= prev.length) return prev
      const nova = [...prev]
      ;[nova[index], nova[alvo]] = [nova[alvo], nova[index]]
      return nova
    })
  }

  async function persistirAgora(blocosParaSalvar) {
    if (!tituloMaterial.trim()) return { error: 'Dê um título pro material antes de lançar.' }
    const payload = {
      nivel, licao, titulo: tituloMaterial.trim(), conteudo: { blocos: blocosParaSalvar },
      criado_por: session.user.id, atualizado_em: new Date().toISOString(),
    }
    if (existente) {
      const { error } = await supabase.from('materiais_aula').update(payload).eq('id', existente.id)
      return { error: error?.message }
    } else {
      const { data, error } = await supabase.from('materiais_aula').insert(payload).select().single()
      if (!error && data) setExistente(data)
      return { error: error?.message }
    }
  }

  async function notificarProfessores() {
    setNotificando(true)
    const mensagem = `Novo conteúdo disponível: ${nivel}, Lição ${String(licao).padStart(2, '0')} — ${tituloMaterial || 'material atualizado'}`
    const { data: sessao } = await supabase.auth.getUser()
    const { error } = await supabase.from('notificacoes_professores').insert({ mensagem, criado_por: sessao?.user?.id })
    setNotificando(false)
    if (error) { setMensagem({ tipo: 'erro', texto: `Erro ao notificar: ${error.message}` }); return }
    setNotificado(true)
    setTimeout(() => setNotificado(false), 3000)
  }

  async function salvarAgora() {
    if (!tituloMaterial.trim()) { setMensagem({ tipo: 'erro', texto: 'Dê um título pro material.' }); return }
    setStatusSalvamento('salvando')
    const { error } = await persistirAgora(blocos)
    setStatusSalvamento(error ? 'idle' : 'salvo')
    if (error) setMensagem({ tipo: 'erro', texto: `Erro ao salvar: ${error}` })
  }

  if (carregando) return <Carregando />

  return (
    <form onSubmit={(e) => e.preventDefault()} className="bg-surface rounded-2xl border border-line shadow-sm shadow-navy/[0.03] overflow-hidden">
      <div className="px-6 py-5 border-b border-line flex items-center gap-2">
        <BookOpenText size={17} className="text-navy" />
        <h2 className="font-display text-base font-semibold text-ink">Material da aula</h2>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Título da aula</label>
          <input required value={tituloMaterial} onChange={(e) => setTituloMaterial(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber"
            placeholder="Ex: Present Simple — rotina diária" />
        </div>

        <div className="space-y-3">
          {blocos.map((bloco, i) => (
            <div key={bloco.id} className="border border-line rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col shrink-0">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="text-ink-soft hover:text-navy disabled:opacity-20"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === blocos.length - 1} className="text-ink-soft hover:text-navy disabled:opacity-20"><ChevronDown size={14} /></button>
                </div>
                <select value={bloco.tipo} onChange={(e) => atualizarBloco(bloco.id, 'tipo', e.target.value)}
                  className="border border-line rounded-lg px-2 py-1.5 text-xs text-ink bg-surface shrink-0">
                  {TIPOS_SECAO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                </select>
                <input value={bloco.titulo} onChange={(e) => atualizarBloco(bloco.id, 'titulo', e.target.value)}
                  className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50" placeholder="Título da seção" />
                <button type="button" onClick={() => setBlocos((prev) => prev.filter((b) => b.id !== bloco.id))} className="text-ink-soft hover:text-red-500 shrink-0"><X size={16} /></button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => atualizarBloco(bloco.id, 'visivel_aluno', !bloco.visivel_aluno)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition ${bloco.visivel_aluno ? 'border-teal/40 bg-teal-soft text-teal' : 'border-line text-ink-soft'}`}>
                  {bloco.visivel_aluno ? <Eye size={12} /> : <EyeOff size={12} />} Aluno
                </button>
                <button type="button" onClick={() => atualizarBloco(bloco.id, 'visivel_professor', !bloco.visivel_professor)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition ${bloco.visivel_professor ? 'border-amber/40 bg-amber-soft text-amber' : 'border-line text-ink-soft'}`}>
                  {bloco.visivel_professor ? <GraduationCap size={12} /> : <EyeOff size={12} />} Professor
                </button>
                <span className="flex-1" />
              </div>

              {bloco.tipo === 'vocabulario' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {PARTES_VOCAB.map((nome) => {
                      const ativa = (bloco.partes || []).some((p) => p.nome === nome)
                      return (
                        <button key={nome} type="button" onClick={() => alternarParteVocab(bloco.id, nome)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${ativa ? 'border-navy bg-navy text-white' : 'border-line text-ink-soft'}`}>{nome}</button>
                      )
                    })}
                  </div>
                  {(bloco.partes || []).map((parte) => (
                    <EditorParte key={parte.nome} parte={parte} nivel={nivel} licao={licao}
                      atualizar={(p) => atualizarParte(bloco.id, parte.nome, p)} />
                  ))}
                </div>
              ) : (
                <textarea value={bloco.corpo} onChange={(e) => atualizarBloco(bloco.id, 'corpo', e.target.value)} rows={5}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50" placeholder="Conteúdo dessa seção..." />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TIPOS_SECAO.map((t) => (
            <button key={t.valor} type="button" onClick={() => setBlocos((prev) => [...prev, novoBloco(t.valor)])}
              className="flex items-center gap-1 text-xs font-medium text-navy bg-paper hover:bg-line px-3 py-1.5 rounded-lg transition">
              <Plus size={13} /> {t.label}
            </button>
          ))}
        </div>

        {mensagem && (
          <p className={`text-sm px-3 py-2 rounded-lg ${mensagem.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-teal-soft text-teal'}`}>{mensagem.texto}</p>
        )}
      </div>

      <div className="px-6 py-4 bg-paper border-t border-line flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={salvarAgora}
            className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-deep transition">
            <Save size={15} /> Salvar agora
          </button>
          <button type="button" onClick={notificarProfessores} disabled={notificando}
            className="flex items-center gap-1.5 bg-teal text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-teal/90 disabled:opacity-50 transition">
            {notificando ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
            {notificado ? 'Professores notificados!' : 'Notificar professores'}
          </button>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          {statusSalvamento === 'salvando' && <><Loader2 size={13} className="animate-spin text-amber" /> Salvando...</>}
          {statusSalvamento === 'salvo' && <><Check size={13} className="text-teal" /> Tudo salvo automaticamente</>}
        </span>
      </div>
    </form>
  )
}
