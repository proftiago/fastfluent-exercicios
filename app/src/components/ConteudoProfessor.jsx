import { useState } from 'react'
import { LivrosGrid, NIVEIS } from './LivrosGrid'
import { LicoesGrid } from './LicoesGrid'
import { BlocosLicoesProfessor } from './BlocosLicoesProfessor'
import { MenuSecoesLicao } from './MenuSecoesLicao'
import { SelecaoTrilha } from './SelecaoTrilha'
import { TrilhaEmBreve } from './TrilhaEmBreve'
import { NavTopo } from './NavTopo'

export function ConteudoProfessor() {
  const [trilhaSel, setTrilhaSel] = useState(null)
  const [nivelSel, setNivelSel] = useState(null)
  const [blocoSel, setBlocoSel] = useState(null)
  const [licaoSel, setLicaoSel] = useState(null)
  const [secaoSel, setSecaoSel] = useState(null)

  const livros = NIVEIS.map((nivel) => ({ nivel, bloqueado: false }))
  const licoes = Array.from({ length: 18 }, (_, i) => ({ numero: i + 1, bloqueada: false }))

  function irParaHome() {
    setTrilhaSel(null); setNivelSel(null); setBlocoSel(null); setLicaoSel(null); setSecaoSel(null)
  }

  function voltarUmNivel() {
    if (secaoSel) { setSecaoSel(null); return }
    if (licaoSel) { setLicaoSel(null); return }
    if (blocoSel) { setBlocoSel(null); return }
    if (nivelSel) { setNivelSel(null); return }
    if (trilhaSel) { setTrilhaSel(null); return }
  }

  if (!trilhaSel) {
    return <SelecaoTrilha onSelecionar={setTrilhaSel} />
  }

  const titulo = licaoSel
    ? `${nivelSel} · Lesson ${String(licaoSel).padStart(2, '0')}`
    : blocoSel
    ? `${nivelSel} · Block ${blocoSel.numero}`
    : nivelSel || trilhaSel.nome

  return (
    <div>
      <NavTopo onVoltar={voltarUmNivel} onHome={irParaHome} titulo={titulo} />

      {!trilhaSel.ativa && !nivelSel && <TrilhaEmBreve nome={trilhaSel.nome} />}

      {trilhaSel.ativa && !nivelSel && (
        <LivrosGrid livros={livros} onSelecionar={(l) => setNivelSel(l.nivel)} />
      )}

      {nivelSel && !blocoSel && (
        <BlocosLicoesProfessor nivel={nivelSel} licoes={licoes} onSelecionarBloco={setBlocoSel} />
      )}

      {blocoSel && !licaoSel && (
        <LicoesGrid licoes={blocoSel.trio} onSelecionar={setLicaoSel} />
      )}

      {licaoSel && (
        <MenuSecoesLicao nivel={nivelSel} licao={licaoSel} audiencia="professor" secaoSel={secaoSel} onSelecionarSecao={setSecaoSel} />
      )}
    </div>
  )
}
