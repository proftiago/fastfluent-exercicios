import { Lock, Rocket, Check } from 'lucide-react'

export function BlocosLicoes({ licoes, onSelecionarBloco }) {
  const blocos = Array.from({ length: 6 }, (_, i) => {
    const inicio = i * 3
    const trio = licoes.slice(inicio, inicio + 3)
    const todasBloqueadas = trio.every((l) => l.bloqueada)
    const todasConcluidas = trio.every((l) => l.concluida)
    const temAtual = trio.some((l) => l.atual)
    return { numero: i + 1, inicio: inicio + 1, fim: inicio + 3, trio, todasBloqueadas, todasConcluidas, temAtual }
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {blocos.map((b) => (
        <button
          key={b.numero}
          onClick={() => !b.todasBloqueadas && onSelecionarBloco(b)}
          disabled={b.todasBloqueadas}
          className={`pressionavel flex flex-col items-center justify-center gap-1.5 aspect-square rounded-2xl border-2 transition ${
            b.todasBloqueadas
              ? 'border-line bg-surface/50 text-ink-faint cursor-not-allowed'
              : b.temAtual
              ? 'border-amber bg-amber-soft text-amber shadow-card-amber'
              : b.todasConcluidas
              ? 'border-teal bg-teal-soft text-teal'
              : 'border-line-strong bg-surface text-ink hover:border-navy/40 hover:shadow-card'
          }`}
        >
          {b.todasBloqueadas && <Lock size={18} className="opacity-60" />}
          {b.temAtual && <Rocket size={18} className="-rotate-45" />}
          {b.todasConcluidas && !b.temAtual && <Check size={18} />}
          {!b.todasBloqueadas && !b.temAtual && !b.todasConcluidas && (
            <span className="font-display text-lg font-bold">{b.numero}</span>
          )}
          <span className="font-mono text-[10px] font-medium opacity-80">
            {String(b.inicio).padStart(2, '0')}–{String(b.fim).padStart(2, '0')}
          </span>
        </button>
      ))}
    </div>
  )
}
