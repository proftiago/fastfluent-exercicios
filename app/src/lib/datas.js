// Datas no fuso de quem está usando (Brasil), no formato AAAA-MM-DD que o banco guarda.
// Não usar toISOString() pra isso: ele converte pra UTC, e das 21h à meia-noite
// já devolve o dia seguinte.
export function dataLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const dataHoje = () => dataLocal()
export const mesAtual = () => dataLocal().slice(0, 7)

// "2026-08-13" → Date ao meio-dia local (new Date('2026-08-13') seria meia-noite
// UTC, que no Brasil ainda é dia 12)
export function lerData(texto) {
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T12:00:00`) : new Date(texto)
}
