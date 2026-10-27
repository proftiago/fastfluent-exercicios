// O que do material da lição o ALUNO pode ver.
// Warm Up, Atividades (jogos de sala), Consolidação e Outro (Performance
// Review…) são roteiro do professor ("Peça aos alunos…"): ficam fora do
// app do aluno mesmo marcados como visíveis — o editor criava todo bloco
// novo com visivel_aluno = true.
export const TIPOS_SO_PROFESSOR = ['warmup', 'atividades', 'consolidacao', 'outro']

export function blocoParaAluno(bloco) {
  const publicado = bloco.publicado !== undefined ? bloco.publicado : true
  return publicado && !!bloco.visivel_aluno && !TIPOS_SO_PROFESSOR.includes(bloco.tipo)
}
