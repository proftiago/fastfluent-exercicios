import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BookOpenText, Volume2, ChevronDown, ChevronUp, Repeat, Sparkles } from 'lucide-react'
import { EstadoVazio } from './EstadoVazio'
import { blocoParaAluno } from '../lib/material'

function falar(texto) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

export function ConteudoParte({ parte, audiencia, ocultarFrasesInline = false }) {
  const [mostrarFrases, setMostrarFrases] = useState(audiencia === 'aluno')

  return (
    <div>
      {parte.itens?.length > 0 && (
        <div className="mb-4">
          {audiencia === 'aluno' && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber uppercase tracking-wide mb-2">
              <Sparkles size={12} /> Palavras novas
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {parte.itens.map((item) => (
              <button key={item.id} onClick={() => falar(item.texto)}
                className="pressionavel flex items-center gap-2 border-2 border-amber/30 bg-amber-soft/60 rounded-xl p-2.5 hover:border-amber/60 transition text-left">
                {item.imagem_url && <img src={item.imagem_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />}
                <span className="text-sm font-medium text-ink flex-1">{item.texto}</span>
                <Volume2 size={14} className="text-amber shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {!ocultarFrasesInline && parte.frases_repetir?.length > 0 && (
        <div className="mb-3">
          {audiencia === 'professor' ? (
            <button onClick={() => setMostrarFrases((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal bg-teal-soft px-3 py-2 rounded-lg mb-2 transition">
              <Repeat size={13} /> Practice on Your Own
              {mostrarFrases ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-teal uppercase tracking-wide mb-2">
              <Repeat size={12} /> Practice on Your Own
            </p>
          )}
          {mostrarFrases && (
            <div className="space-y-1.5">
              {parte.frases_repetir.map((frase) => (
                <button key={frase.id} onClick={() => falar(frase.texto)}
                  className="pressionavel w-full flex items-center gap-2 border border-teal/25 bg-teal-soft/50 rounded-lg p-2.5 hover:border-teal/50 transition text-left">
                  <Volume2 size={14} className="text-teal shrink-0" />
                  <span className="text-sm text-ink flex-1">{frase.texto}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {audiencia === 'professor' && parte.perguntas_pratica?.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">Practice Questions</p>
          {parte.perguntas_pratica.map((p) => (
            <p key={p.id} className="text-sm text-ink bg-paper rounded px-2.5 py-1.5">{p.texto}</p>
          ))}
        </div>
      )}

      {audiencia === 'professor' && parte.checkpoint?.length > 0 && (
        <div className="border border-amber/30 bg-amber-soft rounded-lg p-2.5 space-y-1">
          <p className="text-[11px] font-semibold text-amber uppercase tracking-wide">Checkpoint</p>
          {parte.checkpoint.map((c) => (
            <p key={c.id} className="text-sm text-amber">• {c.texto}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function BlocoVocabularioAbas({ partes, audiencia }) {
  const [abaSel, setAbaSel] = useState(partes[0]?.nome)
  const parteAtiva = partes.find((p) => p.nome === abaSel) || partes[0]

  return (
    <div>
      <div className="flex gap-1.5 mb-4 border-b border-line">
        {partes.map((p) => (
          <button key={p.nome} onClick={() => setAbaSel(p.nome)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              abaSel === p.nome ? 'border-amber text-ink' : 'border-transparent text-ink-soft hover:text-ink'
            }`}>
            {p.nome}
          </button>
        ))}
      </div>
      {parteAtiva && <ConteudoParte parte={parteAtiva} audiencia={audiencia} />}
    </div>
  )
}

export function LeitorMaterial({ nivel, licao, audiencia = 'aluno' }) {
  const [material, setMaterial] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await supabase.from('materiais_aula').select('titulo, conteudo').eq('nivel', nivel).eq('licao', licao).maybeSingle()
      setMaterial(data)
      setCarregando(false)
    }
    carregar()
  }, [nivel, licao])

  if (carregando) return <p className="text-sm text-ink-soft">Carregando...</p>

  const chaveVisibilidade = audiencia === 'professor' ? 'visivel_professor' : 'visivel_aluno'
  const blocos = (material?.conteudo?.blocos || []).filter((b) => {
    if (audiencia !== 'professor') return blocoParaAluno(b)
    const publicado = b.publicado !== undefined ? b.publicado : true
    return publicado && b[chaveVisibilidade]
  })

  if (!material || blocos.length === 0) {
    return <EstadoVazio icone={BookOpenText} titulo="Nothing published yet" descricao="As soon as this lesson's material is created, it will show up here." />
  }

  return (
    <article className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden">
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-8">
        <h1 className="font-display text-2xl font-bold text-ink">{material.titulo}</h1>

        {blocos.map((bloco) => (
          <section key={bloco.id}>
            {bloco.tipo !== 'vocabulario' && (
              <h2 className="font-display text-sm font-semibold text-navy uppercase tracking-wide mb-3 pb-2 border-b border-line">
                {bloco.titulo}
              </h2>
            )}

            {bloco.tipo === 'vocabulario' && bloco.partes?.length > 0 ? (
              <BlocoVocabularioAbas partes={bloco.partes} audiencia={audiencia} />
            ) : (
              <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{bloco.corpo}</p>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}
