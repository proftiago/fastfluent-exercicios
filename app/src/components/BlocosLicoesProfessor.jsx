import { Lock, Check, Rocket } from 'lucide-react'

export function BlocosLicoesProfessor({ nivel, licoes, onSelecionarBloco }) {
  const blocos = Array.from({ length: 6 }, (_, i) => {
    const inicio = i * 3
    const trio = licoes.slice(inicio, inicio + 3)
    const todasBloqueadas = trio.every((l) => l.bloqueada)
    const todasConcluidas = trio.every((l) => l.concluida)
    const temAtual = trio.some((l) => l.atual)
    return { numero: i + 1, inicio: inicio + 1, fim: inicio + 3, trio, todasBloqueadas, todasConcluidas, temAtual }
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {blocos.map((b) => (
        <button
          key={b.numero}
          onClick={() => onSelecionarBloco(b)}
          className="pressionavel relative rounded-2xl overflow-hidden aspect-[3/4] text-left transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <img
            src={`/capas/${nivel?.toLowerCase()}.png`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/30 to-transparent" />
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20" />

          <div className="absolute top-3 right-3">
            {b.todasBloqueadas && (
              <span className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center"><Lock size={12} className="text-white/70" /></span>
            )}
            {b.temAtual && (
              <span className="w-6 h-6 rounded-full bg-amber flex items-center justify-center"><Rocket size={12} className="text-white -rotate-45" /></span>
            )}
            {b.todasConcluidas && !b.temAtual && (
              <span className="w-6 h-6 rounded-full bg-teal flex items-center justify-center"><Check size={12} className="text-white" /></span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-mono text-[10px] text-amber uppercase tracking-wide">Block {b.numero}</p>
            <p className="font-display text-sm font-bold text-white leading-tight">
              {String(b.inicio).padStart(2, '0')}–{String(b.fim).padStart(2, '0')}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
