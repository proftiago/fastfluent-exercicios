import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { comecarGravacao, extensaoAudio, podeGravar, temReconhecimento } from '../lib/fala'
import { Mic, Square, RotateCcw, Check } from 'lucide-react'

// Desafio de fluência: para cada item o aluno vê a imagem/palavra-chave, tem
// N segundos e fala uma frase. Grava o áudio (vai pro bucket privado
// respostas-audio, na pasta do próprio aluno) e a transcrição; o professor
// ouve e corrige.

export function DesafioFluencia({ exercicio, clienteId, onEnviado, onCancelar }) {
  const { session } = useAuth()
  const segundos = Number(exercicio.conteudo.segundos) || 15
  const itens = exercicio.conteudo.perguntas || []
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState({}) // id → { blob, tipo, texto, url }
  const [gravando, setGravando] = useState(false)
  const [restante, setRestante] = useState(segundos)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const gravacao = useRef(null)
  const relogio = useRef(null)

  const item = itens[indice]
  const resposta = item ? respostas[item.id] : null

  useEffect(() => () => { clearInterval(relogio.current); gravacao.current?.parar() }, [])

  async function comecar() {
    setErro('')
    try {
      gravacao.current = await comecarGravacao()
    } catch {
      setErro('Allow the microphone to record your answer.')
      return
    }
    setGravando(true)
    setRestante(segundos)
    const fim = Date.now() + segundos * 1000
    relogio.current = setInterval(() => {
      const r = Math.max(0, Math.ceil((fim - Date.now()) / 1000))
      setRestante(r)
      if (r === 0) parar()
    }, 200)
  }

  async function parar() {
    clearInterval(relogio.current)
    if (!gravacao.current) return
    const g = gravacao.current
    gravacao.current = null
    setGravando(false)
    const { blob, tipo, texto } = await g.parar()
    setRespostas((r) => ({ ...r, [item.id]: { blob, tipo, texto, url: URL.createObjectURL(blob) } }))
  }

  function editarTexto(texto) {
    setRespostas((r) => ({ ...r, [item.id]: { ...r[item.id], texto } }))
  }

  const prontos = itens.filter((i) => respostas[i.id]?.blob && (respostas[i.id].texto || '').trim()).length

  async function enviar() {
    setErro('')
    setEnviando(true)
    const respostaItens = []
    for (const i of itens) {
      const r = respostas[i.id]
      const caminho = `${session.user.id}/${exercicio.id}/${i.id}-${Date.now()}.${extensaoAudio(r.tipo)}`
      const { error } = await supabase.storage.from('respostas-audio').upload(caminho, r.blob, { contentType: r.tipo || 'audio/webm' })
      if (error) { setEnviando(false); setErro(`Could not upload the audio: ${error.message}`); return }
      respostaItens.push({ id: i.id, texto: r.texto.trim(), audio: caminho })
    }
    const { error } = await supabase.from('tentativas').insert({ exercicio_id: exercicio.id, cliente_id: clienteId, resposta: { itens: respostaItens } })
    if (error) { setEnviando(false); setErro(`Error submitting: ${error.message}`); return }

    supabase.functions.invoke('notificar-professor', { body: { exercicio_id: exercicio.id, cliente_id: clienteId } }).catch(() => {})
    let atividade = null
    try {
      const { data } = await supabase.rpc('registrar_atividade_aluno', { p_cliente_id: clienteId })
      atividade = Array.isArray(data) ? data[0] : data
    } catch (e) { console.error(e) }
    setEnviando(false)
    onEnviado?.(atividade)
  }

  if (!podeGravar) {
    return <p className="text-sm text-ink-soft bg-paper rounded-xl p-4">This browser can't record audio. Open the app in Chrome (Android/computer) or Safari (iPhone).</p>
  }

  const pct = gravando ? (restante / segundos) * 100 : 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="rotulo-aluno">Fluency challenge · {indice + 1} of {itens.length}</p>
        <p className="text-xs text-ink-soft">{segundos}s to answer</p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-paper">
        {item?.imagem_url && <img src={item.imagem_url} alt="" className="w-full h-56 object-cover" />}
        {item?.pergunta && <p className="font-display text-2xl font-semibold text-ink text-center px-4 py-5">{item.pergunta}</p>}
      </div>

      <p className="text-sm text-ink-soft text-center">Say one complete sentence about it, in English.</p>

      <div className="flex flex-col items-center gap-3">
        {gravando ? (
          <button onClick={parar} aria-label="Stop recording"
            className="pressionavel relative w-24 h-24 rounded-full flex items-center justify-center text-white"
            style={{ background: `conic-gradient(#C2412F ${pct}%, var(--color-line-strong) ${pct}% 100%)` }}>
            <span className="w-[84px] h-[84px] rounded-full bg-[#C2412F] flex flex-col items-center justify-center">
              <Square size={20} className="fill-white" />
              <span className="font-display text-lg font-semibold mt-0.5">{restante}s</span>
            </span>
          </button>
        ) : !resposta ? (
          <button onClick={comecar} className="pressionavel w-24 h-24 rounded-full bg-navy text-white flex flex-col items-center justify-center gap-1">
            <Mic size={28} /><span className="text-xs font-semibold">Start</span>
          </button>
        ) : null}
      </div>

      {resposta && !gravando && (
        <div className="space-y-3 animar-entrada">
          <audio src={resposta.url} controls className="w-full" />
          <div>
            <label htmlFor={`fala-${item.id}`} className="block text-xs font-medium text-ink-soft mb-1">
              {temReconhecimento ? 'What we heard (fix it if needed)' : 'Type what you said'}
            </label>
            <textarea id={`fala-${item.id}`} rows={2} value={resposta.texto || ''} onChange={(e) => editarTexto(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setRespostas((r) => { const n = { ...r }; delete n[item.id]; return n }) }}
              className="flex items-center gap-1.5 text-sm text-ink-soft px-3 py-2"><RotateCcw size={15} /> Record again</button>
            {indice < itens.length - 1 && (
              <button onClick={() => setIndice(indice + 1)} disabled={!(resposta.texto || '').trim()}
                className="pressionavel ml-auto bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40">Next</button>
            )}
          </div>
        </div>
      )}

      {itens.length > 1 && (
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {itens.map((i, n) => (
            <span key={i.id} className={`h-1.5 rounded-full transition-all ${n === indice ? 'w-6 bg-navy' : respostas[i.id] ? 'w-1.5 bg-teal' : 'w-1.5 bg-line-strong'}`} />
          ))}
        </div>
      )}

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={enviar} disabled={enviando || prontos < itens.length}
          className="pressionavel flex items-center gap-1.5 bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40">
          <Check size={15} /> {enviando ? 'Sending…' : `Submit (${prontos}/${itens.length})`}
        </button>
        <button type="button" onClick={onCancelar} className="text-sm text-ink-soft px-3">Cancel</button>
      </div>
    </div>
  )
}
