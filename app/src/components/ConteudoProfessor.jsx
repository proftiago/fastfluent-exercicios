import { useState } from 'react'
import { LivrosGrid, NIVEIS } from './LivrosGrid'
import { LicoesGrid } from './LicoesGrid'
import { LeitorMaterial } from './LeitorMaterial'
import { ChevronLeft } from 'lucide-react'

export function ConteudoProfessor() {
  const [nivelSel, setNivelSel] = useState(null)
  const [licaoSel, setLicaoSel] = useState(null)

  const livros = NIVEIS.map((nivel) => ({ nivel, bloqueado: false }))
  const licoes = Array.from({ length: 18 }, (_, i) => ({ numero: i + 1, bloqueada: false }))

  if (nivelSel && licaoSel) {
    return (
      <div>
        <button onClick={() => setLicaoSel(null)} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4 transition">
          <ChevronLeft size={16} /> {nivelSel} — Lições
        </button>
        <LeitorMaterial nivel={nivelSel} licao={licaoSel} audiencia="professor" />
      </div>
    )
  }

  if (nivelSel) {
    return (
      <div>
        <button onClick={() => setNivelSel(null)} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4 transition">
          <ChevronLeft size={16} /> Livros
        </button>
        <LicoesGrid licoes={licoes} onSelecionar={setLicaoSel} />
      </div>
    )
  }

  return <LivrosGrid livros={livros} onSelecionar={(l) => setNivelSel(l.nivel)} />
}
