export const NIVEIS = ['Spark', 'Ignition', 'Cruise', 'Momentum', 'Propulsion', 'Velocity', 'Mastery', 'Synergy', 'Apex', 'Beyond']

export function LivrosGrid({ livros, onSelecionar }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {livros.map((l) => (
        <button
          key={l.nivel}
          onClick={() => !l.bloqueado && onSelecionar(l)}
          disabled={l.bloqueado}
          className={`relative rounded-2xl overflow-hidden aspect-[3/4] text-left transition ${
            l.bloqueado ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-card-amber'
          }`}
        >
          <img
            src={`/capas/${l.nivel.toLowerCase()}.png`}
            alt={l.nivel}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent" />
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-mono text-[10px] text-amber uppercase tracking-wide">Livro</p>
            <p className="font-display text-sm font-bold text-white leading-tight">{l.nivel}</p>
            {l.subtitulo && <p className="text-[11px] text-white/60 mt-0.5">{l.subtitulo}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}
