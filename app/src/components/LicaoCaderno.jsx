import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ConteudoParte } from './LeitorMaterial'
import { ListaExercicios } from './ListaExercicios'
import { Carregando } from './Carregando'
import { ChevronDown, Lock, ListChecks } from 'lucide-react'

// Lição no layout Caderno (temas claro e escuro), na organização do livro do
// Park: as 3 lições do bloco em abas no topo e as seções da lição numa lista
// que abre e fecha no lugar (sem trocar de tela). Exercícios são a última seção.

function pad(n) {
  return String(n).padStart(2, '0')
}

function montarSecoes(material) {
  const blocos = (material?.conteudo?.blocos || []).filter((b) => (b.publicado !== undefined ? b.publicado : true) && b.visivel_aluno)
  const secoes = []
  const vocab = []
  blocos.forEach((bloco) => {
    if (bloco.tipo === 'vocabulario') {
      ;(bloco.partes || []).forEach((parte) => vocab.push({ chave: `${bloco.id}-${parte.nome}`, titulo: parte.nome, parte }))
    } else {
      secoes.push({ chave: bloco.id, titulo: bloco.titulo, bloco })
    }
  })
  if (vocab.length) secoes.push({ chave: 'novo-conteudo', titulo: 'New Content', grupo: vocab })
  return secoes
}

function Secao({ numero, titulo, aberta, onAlternar, children, destaque }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button onClick={onAlternar} aria-expanded={aberta}
        className="w-full flex items-center gap-3 py-4 text-left">
        <span className={`font-display text-lg w-7 shrink-0 ${destaque ? 'text-amber' : 'text-ink-faint'}`}>{numero}</span>
        <span className="flex-1 font-medium text-ink">{titulo}</span>
        <ChevronDown size={18} className={`text-ink-faint shrink-0 transition ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && <div className="pb-5 animar-entrada">{children}</div>}
    </div>
  )
}

export function LicaoCaderno({ nivel, trio, licao, onTrocarLicao, clienteId, abrirExercicios }) {
  const [material, setMaterial] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abertas, setAbertas] = useState(() => new Set(abrirExercicios ? ['exercicios'] : []))

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setAbertas(new Set(abrirExercicios ? ['exercicios'] : []))
    supabase.from('materiais_aula').select('titulo, conteudo').eq('nivel', nivel).eq('licao', licao).maybeSingle()
      .then(({ data }) => { if (ativo) { setMaterial(data); setCarregando(false) } })
    return () => { ativo = false }
  }, [nivel, licao, abrirExercicios])

  function alternar(chave) {
    setAbertas((atual) => {
      const nova = new Set(atual)
      if (nova.has(chave)) nova.delete(chave); else nova.add(chave)
      return nova
    })
  }

  const secoes = montarSecoes(material)

  return (
    <div className="animar-entrada">
      <div role="tablist" aria-label="Lições do bloco" className="grid grid-cols-3 gap-2 mb-6">
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

      {material?.titulo && <h2 className="font-display text-2xl font-semibold text-ink mb-2">{material.titulo}</h2>}

      {carregando ? <Carregando /> : (
        <div className="bg-surface rounded-2xl shadow-card px-5">
          {secoes.length === 0 && (
            <p className="py-5 text-sm text-ink-soft">The material for this lesson isn't published yet — the exercises are below.</p>
          )}
          {secoes.map((s, i) => (
            <Secao key={s.chave} numero={`${i + 1}.`} titulo={s.titulo} aberta={abertas.has(s.chave)} onAlternar={() => alternar(s.chave)}>
              {s.grupo ? (
                <div className="space-y-6">
                  {s.grupo.map((g) => (
                    <div key={g.chave}>
                      <p className="rotulo-aluno mb-2">{g.titulo}</p>
                      <ConteudoParte parte={g.parte} audiencia="aluno" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">{s.bloco.corpo}</p>
              )}
            </Secao>
          ))}
          <Secao numero={<ListChecks size={18} />} titulo="Exercises" destaque aberta={abertas.has('exercicios')} onAlternar={() => alternar('exercicios')}>
            <ListaExercicios clienteId={clienteId} nivel={nivel} licao={licao} />
          </Secao>
        </div>
      )}
    </div>
  )
}
