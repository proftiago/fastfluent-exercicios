import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { blocoParaAluno } from '../lib/material'
import { ConteudoParte } from './LeitorMaterial'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { BookOpenText, Sparkles, ChevronRight, ChevronDown, Layers } from 'lucide-react'

const ICONES_TIPO = {
  warmup: Sparkles,
  structure: BookOpenText,
  consolidacao: BookOpenText,
  curiosidades: Sparkles,
  atividades: BookOpenText,
  outro: BookOpenText,
}

export function MenuSecoesLicaoAluno({ nivel, licao, secaoSel, onSelecionarSecao }) {
  const [material, setMaterial] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [grupoAberto, setGrupoAberto] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await supabase.from('materiais_aula').select('titulo, conteudo').eq('nivel', nivel).eq('licao', licao).maybeSingle()
      setMaterial(data)
      setCarregando(false)
    }
    carregar()
  }, [nivel, licao])

  if (carregando) return <Carregando />

  const blocosVisiveis = (material?.conteudo?.blocos || []).filter(blocoParaAluno)

  const itensTopo = []
  const partesVocab = []
  blocosVisiveis.forEach((bloco) => {
    if (bloco.tipo === 'vocabulario') {
      ;(bloco.partes || []).forEach((parte) => {
        partesVocab.push({ chave: `${bloco.id}-${parte.nome}`, titulo: parte.nome, tipo: 'parte', bloco, parte })
      })
    } else {
      itensTopo.push({ chave: bloco.id, titulo: bloco.titulo, tipo: 'texto', bloco })
    }
  })

  const todosItens = [...itensTopo, ...partesVocab]

  if (!material || todosItens.length === 0) {
    return <EstadoVazio icone={BookOpenText} titulo="Nothing published yet" descricao="As soon as this lesson's material is created, it will show up here." />
  }

  if (secaoSel) {
    const item = todosItens.find((i) => i.chave === secaoSel)
    if (!item) return null

    return (
      <div className="animar-entrada">
        {item.tipo === 'parte' ? (
          <ConteudoParte parte={item.parte} audiencia="aluno" />
        ) : (
          <article className="bg-surface rounded-2xl border border-line shadow-card p-6">
            <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{item.bloco.corpo}</p>
          </article>
        )}
      </div>
    )
  }

  return (
    <div className="animar-entrada space-y-1.5">
      {itensTopo.map((item) => {
        const Icone = ICONES_TIPO[item.bloco.tipo] || BookOpenText
        return (
          <button key={item.chave} onClick={() => onSelecionarSecao(item.chave)}
            className="pressionavel w-full flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3 hover:border-amber/40 hover:shadow-card transition text-left">
            <div className="w-8 h-8 rounded-lg bg-paper flex items-center justify-center shrink-0">
              <Icone size={15} className="text-navy" />
            </div>
            <span className="flex-1 text-sm font-medium text-ink">{item.titulo}</span>
            <ChevronRight size={16} className="text-ink-faint shrink-0" />
          </button>
        )
      })}

      {partesVocab.length > 0 && (
        <div className="border border-line rounded-xl overflow-hidden">
          <button onClick={() => setGrupoAberto((v) => !v)}
            className="w-full flex items-center gap-3 bg-surface px-4 py-3 hover:bg-paper/60 transition text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-soft flex items-center justify-center shrink-0">
              <Layers size={15} className="text-amber" />
            </div>
            <span className="flex-1 text-sm font-medium text-ink">New Content</span>
            {grupoAberto ? <ChevronDown size={16} className="text-ink-faint shrink-0" /> : <ChevronRight size={16} className="text-ink-faint shrink-0" />}
          </button>
          {grupoAberto && (
            <div className="border-t border-line bg-paper/40">
              {partesVocab.map((item) => (
                <button key={item.chave} onClick={() => onSelecionarSecao(item.chave)}
                  className="pressionavel w-full flex items-center gap-3 pl-14 pr-4 py-2.5 hover:bg-surface transition text-left border-b border-line last:border-b-0">
                  <span className="flex-1 text-sm text-ink-soft">{item.titulo}</span>
                  <ChevronRight size={14} className="text-ink-faint shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
