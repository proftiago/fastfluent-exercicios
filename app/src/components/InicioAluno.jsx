import { Camera, Flame, Star, Check, Lock, PlayCircle, ArrowRight, Clock, BookOpenText } from 'lucide-react'
import { LivrosGrid } from './LivrosGrid'

// Tela inicial do aluno em três versões, uma por tema:
// claro e escuro = Caderno (mesma tela, cores diferentes), kids = Trilha.
// Todas recebem os mesmos dados da AreaAluno.

function pad(n) {
  return String(n).padStart(2, '0')
}

function livrosParaGrid(livros) {
  return livros.map((l) => ({
    nivel: l.nivel,
    subtitulo: l.idioma,
    bloqueado: false,
    progresso: Math.round((l.licaoAtual / 18) * 100),
    _livro: l,
  }))
}

function AvisoStreak({ streak }) {
  return (
    <div className="animar-entrada flex items-center gap-3 bg-amber-soft border border-amber/30 rounded-2xl px-4 py-3 mb-4">
      <Clock size={20} className="text-amber shrink-0" />
      <p className="text-sm text-amber flex-1">
        Your <strong>{streak}-day streak</strong> is about to end! Do an exercise today to keep it going.
      </p>
    </div>
  )
}

function SeusLivros({ livros, onAbrirLivro, titulo = 'Your books' }) {
  if (livros.length === 0) return null
  return (
    <div className="animar-entrada">
      <h2 className="font-display text-lg font-semibold text-ink mb-3">{titulo}</h2>
      <LivrosGrid livros={livrosParaGrid(livros)} onSelecionar={(l) => onAbrirLivro(l._livro)} />
    </div>
  )
}

export function InicioCaderno({ primeiroNome, avatarUrl, streak, xp, totalLicoes, livros, livroEmAndamento, streakEmRisco, onContinuar, onAbrirLivro }) {
  const hoje = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <>
      <div className="flex justify-between items-start mb-5 animar-entrada">
        <div>
          <p className="text-sm text-ink-soft">{hoje}</p>
          <p className="font-display text-3xl font-semibold text-ink mt-1">{primeiroNome ? `Hi, ${primeiroNome}.` : 'Hello.'}</p>
        </div>
        <div className="w-11 h-11 rounded-full bg-navy overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={16} className="text-white/70" />}
        </div>
      </div>

      <div className="flex gap-5 pb-4 mb-5 border-b border-line animar-entrada">
        {[[streak, 'day streak'], [xp, 'XP'], [totalLicoes, 'lessons']].map(([v, r], i) => (
          <div key={r} className={`${i ? 'pl-5 border-l border-line' : ''}`}>
            <p className="font-display text-2xl font-semibold text-ink">{v}</p>
            <p className="text-xs text-ink-soft">{r}</p>
          </div>
        ))}
      </div>

      {streakEmRisco && <AvisoStreak streak={streak} />}

      {livroEmAndamento && (
        <div className="mb-7 animar-entrada">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber mb-3">Pick up where you left off</p>
          <button onClick={onContinuar}
            className="pressionavel w-full flex items-center gap-4 bg-surface rounded-2xl px-4 py-4 shadow-card text-left">
            <span className="w-11 h-11 rounded-full bg-amber-soft flex items-center justify-center shrink-0">
              <BookOpenText size={20} className="text-amber" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display text-lg font-semibold text-ink">{livroEmAndamento.nivel} · Lesson {pad(livroEmAndamento.licaoAtual)}</span>
              <span className="block text-sm text-ink-soft mt-0.5">Content and exercises</span>
            </span>
            <ArrowRight size={18} className="text-ink-soft" />
          </button>
        </div>
      )}

      <SeusLivros livros={livros} onAbrirLivro={onAbrirLivro} />
    </>
  )
}

// Trilha: o bloco de 3 lições em andamento vira um caminho em zigue-zague.
export function InicioTrilha({ primeiroNome, avatarUrl, streak, xp, livros, livroEmAndamento, licoesDoLivro, onAbrirLicao, onAbrirLivro }) {
  const atual = livroEmAndamento
  const numeroAtual = atual?.licaoAtual || 1
  const inicioBloco = Math.floor((numeroAtual - 1) / 3) * 3
  const caminho = atual ? licoesDoLivro(atual).slice(inicioBloco, inicioBloco + 3) : []
  const desvios = ['ml-[18%]', 'ml-[52%]', 'ml-[30%]']

  return (
    <>
      <div className="rounded-3xl bg-navy text-white p-4 mb-2 animar-entrada">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={16} className="text-navy" />}
            </div>
            <p className="font-display text-xl font-extrabold">{primeiroNome ? `Hi, ${primeiroNome}!` : 'Hi!'}</p>
          </div>
          <div className="flex gap-1.5">
            <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 font-extrabold text-sm"><Flame size={15} className="fill-amber text-amber" />{streak}</span>
            <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 font-extrabold text-sm"><Star size={15} className="fill-amber text-amber" />{xp}</span>
          </div>
        </div>
        {atual && (
          <div className="mt-4 bg-surface text-ink rounded-2xl px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-navy">{atual.nivel} · Unit {Math.floor(inicioBloco / 3) + 1}</p>
            <p className="text-lg font-extrabold">Lessons {pad(inicioBloco + 1)}–{pad(inicioBloco + 3)}</p>
          </div>
        )}
      </div>

      {caminho.length > 0 && (
        <div className="py-6 space-y-5 mb-4">
          {caminho.map((l, i) => (
            <div key={l.numero} className={desvios[i]}>
              <button onClick={() => !l.bloqueada && onAbrirLicao(atual, l.numero)} disabled={l.bloqueada}
                aria-label={`Lesson ${l.numero}`}
                className="pressionavel flex flex-col items-center gap-1.5 disabled:cursor-not-allowed">
                {l.atual && <span className="bg-ink text-white rounded-xl px-3 py-1 text-xs font-extrabold">START · {pad(l.numero)}</span>}
                <span className={`flex items-center justify-center rounded-full ${
                  l.atual ? 'w-20 h-[74px] bg-amber border-b-[7px] border-[#D99A12] text-ink shadow-[0_0_0_8px_var(--color-amber-soft)]'
                    : l.concluida ? 'w-[68px] h-16 bg-teal border-b-[6px] border-[#1A8752] text-white'
                    : l.bloqueada ? 'w-[68px] h-16 bg-line border-b-[6px] border-line-strong text-ink-faint'
                    : 'w-[68px] h-16 bg-surface border-2 border-line-strong border-b-[6px] text-navy'}`}>
                  {l.atual ? <Star size={30} className="fill-ink" />
                    : l.concluida ? <Check size={26} strokeWidth={3} />
                    : l.bloqueada ? <Lock size={22} />
                    : <span className="text-lg font-black">{pad(l.numero)}</span>}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {atual && (
        <button onClick={() => onAbrirLicao(atual, numeroAtual)}
          className="botao-3d pressionavel w-full h-14 rounded-2xl bg-teal border-b-[5px] border-[#1A8752] text-white font-black tracking-wide mb-7 flex items-center justify-center gap-2">
          <PlayCircle size={20} /> CONTINUE
        </button>
      )}

      <SeusLivros livros={livros} onAbrirLivro={onAbrirLivro} titulo="My books" />
    </>
  )
}
