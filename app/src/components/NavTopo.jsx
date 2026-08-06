import { ChevronLeft, Home } from 'lucide-react'

export function NavTopo({ onVoltar, onHome, titulo }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={onVoltar} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink transition">
        <ChevronLeft size={16} /> Back
      </button>
      {titulo && <p className="text-sm font-medium text-ink truncate px-2">{titulo}</p>}
      <button onClick={onHome} className="text-ink-soft hover:text-ink transition p-1" title="Home">
        <Home size={17} />
      </button>
    </div>
  )
}
