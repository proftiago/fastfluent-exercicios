export function Carregando({ linhas = 3 }) {
  return (
    <div className="space-y-3 animar-entrada">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="bg-surface border border-line rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-paper animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-paper rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
            <div className="h-2.5 bg-paper rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
