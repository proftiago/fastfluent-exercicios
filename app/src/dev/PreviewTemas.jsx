// Só em desenvolvimento (npm run dev → /?preview=escuro|claro|kids):
// mostra a tela inicial de cada tema com dados de exemplo, sem login.
import { InicioOrbita, InicioCaderno, InicioTrilha } from '../components/InicioAluno'
import { BookOpenText, CalendarCheck, User } from 'lucide-react'

const LIVROS = [
  { nivel: 'Spark', idioma: 'Inglês', licoes: Array.from({ length: 18 }, (_, i) => i + 1), licaoAtual: 18 },
  { nivel: 'Ignition', idioma: 'Inglês', licoes: Array.from({ length: 18 }, (_, i) => i + 1), licaoAtual: 7 },
]

function montarLicoes(livro) {
  return Array.from({ length: 18 }, (_, i) => {
    const numero = i + 1
    const liberada = livro.licoes.includes(numero)
    return { numero, atual: liberada && numero === livro.licaoAtual, concluida: liberada && numero < livro.licaoAtual, bloqueada: !liberada || numero > livro.licaoAtual + 1 }
  })
}

export function PreviewTemas({ tema }) {
  const props = {
    primeiroNome: 'Marina', avatarUrl: null, streak: 12, xp: 1240, totalLicoes: 36,
    livros: LIVROS, livroEmAndamento: LIVROS[1], streakEmRisco: tema === 'escuro',
    onContinuar: () => {}, onAbrirLivro: () => {}, onAbrirLicao: () => {}, licoesDoLivro: montarLicoes,
  }
  const Inicio = tema === 'kids' ? InicioTrilha : tema === 'claro' ? InicioCaderno : InicioOrbita
  return (
    <div data-tema={tema} className="min-h-screen bg-paper pb-20">
      <header className="bg-navy h-14" />
      <main className="max-w-2xl mx-auto px-4 py-6"><Inicio {...props} /></main>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          {[[BookOpenText, 'Learn', true], [CalendarCheck, 'History'], [User, 'Profile']].map(([I, r, a]) => (
            <span key={r} className={`flex flex-col items-center gap-0.5 py-2.5 ${a ? 'text-amber' : 'text-ink-faint'}`}><I size={20} /><span className="text-[10px] font-medium">{r}</span></span>
          ))}
        </div>
      </nav>
    </div>
  )
}
