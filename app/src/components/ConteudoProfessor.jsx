import { useState } from 'react'
import { LivrosGrid, NIVEIS } from './LivrosGrid'
import { BlocosLicoesProfessor } from './BlocosLicoesProfessor'
import { LicaoCaderno } from './LicaoCaderno'
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

  // como no app do aluno: escolher o bloco já abre a 1ª lição dele, com as
  // 3 lições em abas e os passos da lição (LicaoCaderno, visão do professor)
  function abrirBloco(bloco) {
    setBlocoSel(bloco)
    setLicaoSel(bloco.inicio)
  }

  function voltarUmNivel() {
    if (secaoSel) { setSecaoSel(null); return }
    if (licaoSel || blocoSel) { setLicaoSel(null); setBlocoSel(null); return }
    if (nivelSel) { setNivelSel(null); return }
    if (trilhaSel) { setTrilhaSel(null); return }
  }

  if (!trilhaSel) {
    return <SelecaoTrilha onSelecionar={setTrilhaSel} />
  }

  const titulo = blocoSel
    ? `${nivelSel} · Lessons ${String(blocoSel.inicio).padStart(2, '0')}–${String(blocoSel.fim).padStart(2, '0')}`
    : licaoSel
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
        <BlocosLicoesProfessor nivel={nivelSel} licoes={licoes} onSelecionarBloco={abrirBloco} />
      )}

      {blocoSel && licaoSel && (
        <LicaoCaderno nivel={nivelSel} trio={blocoSel.trio} licao={licaoSel} onTrocarLicao={setLicaoSel} audiencia="professor" />
      )}
    </div>
  )
}
