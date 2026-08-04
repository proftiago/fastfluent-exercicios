import { Rocket, X } from 'lucide-react'

const CORES = ['#EFA036', '#279B87', '#FFFFFF', '#F5C518']

export function Comemoracao({ titulo, descricao, onFechar }) {
  const confetes = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    esquerda: Math.random() * 100,
    atraso: Math.random() * 0.6,
    cor: CORES[i % CORES.length],
    tamanho: 5 + Math.random() * 5,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/70 backdrop-blur-sm px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetes.map((c) => (
          <span key={c.id} className="confete rounded-sm"
            style={{
              left: `${c.esquerda}%`,
              width: c.tamanho, height: c.tamanho * 1.6,
              background: c.cor,
              animationDelay: `${c.atraso}s`,
            }} />
        ))}
      </div>

      <div className="selo-comemoracao relative bg-surface rounded-3xl shadow-card-amber border border-amber/30 p-8 max-w-xs w-full text-center">
        <button onClick={onFechar} className="absolute top-3 right-3 text-ink-faint hover:text-ink-soft transition">
          <X size={18} />
        </button>
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber to-amber/70 flex items-center justify-center mb-4 shadow-card-amber">
          <Rocket size={28} className="text-white -rotate-45" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink mb-1">{titulo}</h2>
        {descricao && <p className="text-sm text-ink-soft mb-5">{descricao}</p>}
        <button onClick={onFechar} className="pressionavel w-full bg-navy text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-navy-deep transition">
          Continuar
        </button>
      </div>
    </div>
  )
}
