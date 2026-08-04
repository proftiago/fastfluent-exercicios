import { Lock, Check, Rocket } from 'lucide-react'

export function LicoesGrid({ licoes, onSelecionar }) {
  return (
    <div className="relative py-4">
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-line" />

      <div className="relative space-y-3">
        {licoes.map((l, i) => {
          const ladoDireito = i % 2 === 0

          return (
            <div key={l.numero} className={`flex ${ladoDireito ? 'justify-end pr-[calc(50%-2.75rem)]' : 'justify-start pl-[calc(50%-2.75rem)]'}`}>
              <button
                onClick={() => !l.bloqueada && onSelecionar(l.numero)}
                disabled={l.bloqueada}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-16 rounded-full border-2 transition ${
                  l.bloqueada
                    ? 'border-line bg-surface/60 text-ink-faint cursor-not-allowed'
                    : l.atual
                    ? 'border-amber bg-amber text-white shadow-card-amber pulso-atual'
                    : l.concluida
                    ? 'border-teal bg-teal-soft text-teal hover:border-teal shadow-card-teal'
                    : 'border-line-strong bg-surface text-ink hover:border-navy/40 hover:shadow-card'
                }`}
              >
                {l.bloqueada && <Lock size={15} className="opacity-60" />}
                {l.atual && !l.bloqueada && <Rocket size={16} className="-rotate-45" />}
                {l.concluida && !l.bloqueada && !l.atual && <Check size={16} />}
                {!l.bloqueada && !l.atual && !l.concluida && (
                  <span className="font-mono text-sm font-semibold">{String(l.numero).padStart(2, '0')}</span>
                )}
                {(l.atual || l.concluida) && (
                  <span className="font-mono text-[9px] font-medium opacity-80">{String(l.numero).padStart(2, '0')}</span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
