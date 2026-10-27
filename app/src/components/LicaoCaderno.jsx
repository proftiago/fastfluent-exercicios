import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { blocoParaAluno } from '../lib/material'
import { ConteudoParte } from './LeitorMaterial'
import { ListaExercicios } from './ListaExercicios'
import { Carregando } from './Carregando'
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react'

// Lição no layout Caderno (temas claro e escuro), na organização do livro do
// Park: as 3 lições do bloco em abas no topo e, dentro da lição, um PASSO por
// vez (Structure, cada grupo de palavras novas, Exercises), pra o aluno focar
// só naquele ponto. Só entra o que é do aluno (lib/material.js).

function pad(n) {
  return String(n).padStart(2, '0')
}

function montarPassos(material) {
  const passos = []
  ;(material?.conteudo?.blocos || []).filter(blocoParaAluno).forEach((bloco) => {
    if (bloco.tipo === 'vocabulario') {
      ;(bloco.partes || []).forEach((parte) => passos.push({ chave: `${bloco.id}-${parte.nome}`, titulo: parte.nome, parte }))
    } else {
      passos.push({ chave: bloco.id, titulo: bloco.titulo, bloco })
    }
  })
  passos.push({ chave: 'exercicios', titulo: 'Exercises', exercicios: true })
  return passos
}

export function LicaoCaderno({ nivel, trio, licao, onTrocarLicao, clienteId, abrirExercicios }) {
  const [material, setMaterial] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [passoSel, setPassoSel] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    supabase.from('materiais_aula').select('titulo, conteudo').eq('nivel', nivel).eq('licao', licao).maybeSingle()
      .then(({ data }) => {
        if (!ativo) return
        setMaterial(data)
        setPassoSel(abrirExercicios ? montarPassos(data).length - 1 : 0)
        setCarregando(false)
      })
    return () => { ativo = false }
  }, [nivel, licao, abrirExercicios])

  const passos = montarPassos(material)
  const indice = Math.min(passoSel, passos.length - 1)
  const passo = passos[indice]
  const proximo = passos[indice + 1]

  function irPara(i) {
    setPassoSel(i)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="animar-entrada">
      <div role="tablist" aria-label="Lições do bloco" className="grid grid-cols-3 gap-2 mb-5">
        {trio.map((l) => (
          <button key={l.numero} role="tab" aria-selected={l.numero === licao} disabled={l.bloqueada}
            onClick={() => onTrocarLicao(l.numero)}
            className={`h-12 rounded-full text-sm transition flex items-center justify-center gap-1.5 ${
              l.numero === licao ? 'bg-navy text-white font-semibold'
                : l.bloqueada ? 'border border-line text-ink-faint cursor-not-allowed'
                : 'border border-line-strong text-ink hover:bg-surface'}`}>
            {l.bloqueada && <Lock size={13} />} Lesson {pad(l.numero)}
            {l.atual && l.numero !== licao && <span className="w-1.5 h-1.5 rounded-full bg-amber" aria-label="aula atual" />}
          </button>
        ))}
      </div>

      {carregando ? <Carregando /> : (
        <>
          <nav aria-label="Passos da lição" className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 mb-5">
            {passos.map((p, i) => (
              <button key={p.chave} onClick={() => irPara(i)} aria-current={i === indice ? 'step' : undefined}
                className={`shrink-0 flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full text-sm transition ${
                  i === indice ? 'bg-surface shadow-card text-ink font-semibold' : 'text-ink-soft hover:text-ink'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i === indice ? 'bg-navy text-white' : 'bg-line text-ink-soft'}`}>{i + 1}</span>
                {p.titulo}
              </button>
            ))}
          </nav>

          <section aria-label={passo.titulo} key={passo.chave} className="animar-entrada">
            <p className="rotulo-aluno mb-1">Step {indice + 1} of {passos.length}</p>
            <h2 className="font-display text-2xl font-semibold text-ink mb-4">{passo.titulo}</h2>

            {passo.exercicios ? (
              <ListaExercicios clienteId={clienteId} nivel={nivel} licao={licao} />
            ) : (
              <div className="bg-surface rounded-2xl shadow-card p-5">
                {passo.parte
                  ? <ConteudoParte parte={passo.parte} audiencia="aluno" />
                  : <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{passo.bloco.corpo}</p>}
              </div>
            )}
          </section>

          <div className="flex items-center gap-3 mt-6">
            {indice > 0 && (
              <button onClick={() => irPara(indice - 1)}
                className="h-12 px-4 rounded-full border border-line-strong text-ink text-sm flex items-center gap-1.5">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {proximo && (
              <button onClick={() => irPara(indice + 1)}
                className="pressionavel h-12 px-5 ml-auto rounded-full bg-navy text-white text-sm font-semibold flex items-center gap-1.5">
                Next: {proximo.titulo} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
