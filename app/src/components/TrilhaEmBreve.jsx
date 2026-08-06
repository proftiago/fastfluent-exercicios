import { Rocket } from 'lucide-react'

export function TrilhaEmBreve({ nome }) {
  return (
    <div className="animar-entrada flex flex-col items-center justify-center text-center px-6 py-16 border border-dashed border-line rounded-2xl bg-surface/50">
      <div className="w-16 h-16 rounded-2xl bg-amber-soft flex items-center justify-center mb-4">
        <Rocket size={26} className="text-amber" />
      </div>
      <p className="font-display text-lg font-semibold text-ink mb-1">{nome} is on its way</p>
      <p className="text-sm text-ink-soft max-w-xs">We're building this track right now. Check back soon!</p>
    </div>
  )
}
