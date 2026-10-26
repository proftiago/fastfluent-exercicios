import { useState } from 'react'

// Tema da área do aluno: 'escuro' (Órbita), 'claro' (Caderno) ou 'kids' (Trilha).
// Se o aluno nunca escolheu, o padrão vem da faixa etária da turma
// (Kids/Pré-Teens → kids, resto → escuro). Chave nova pra não herdar o
// 'claro' que o tema antigo gravava pra todo mundo.
const CHAVE = 'ff_tema_aluno'
export const TEMAS_ALUNO = ['escuro', 'claro', 'kids']
const FAIXAS_KIDS = ['K', 'PT']

function lerEscolha() {
  try {
    const t = localStorage.getItem(CHAVE)
    return TEMAS_ALUNO.includes(t) ? t : null
  } catch {
    return null
  }
}

export function temaPadraoPorFaixa(faixas) {
  return faixas.some((f) => FAIXAS_KIDS.includes(f)) ? 'kids' : 'escuro'
}

export function useTemaAluno() {
  const [escolhido, setEscolhido] = useState(lerEscolha)
  const [padrao, setPadrao] = useState('escuro')

  function escolher(t) {
    setEscolhido(t)
    try { localStorage.setItem(CHAVE, t) } catch { /* modo privado: vale só nesta sessão */ }
  }

  return { tema: escolhido || padrao, escolher, definirPadrao: setPadrao }
}
