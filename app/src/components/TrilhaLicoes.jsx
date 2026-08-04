const TOTAL_LICOES = 18

export function TrilhaLicoes({ licaoAtual }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: TOTAL_LICOES }, (_, i) => i + 1).map((n) => {
        const concluida = n < licaoAtual
        const atual = n === licaoAtual
        return (
          <div key={n} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={[
                'w-full h-1.5 rounded-full transition-colors',
                concluida ? 'bg-teal' : atual ? 'bg-amber' : 'bg-line',
              ].join(' ')}
            />
            {atual && (
              <span className="font-mono text-[10px] text-amber font-semibold">{n}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
