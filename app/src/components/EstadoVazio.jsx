import { Rocket } from 'lucide-react'

export function EstadoVazio({ icone: Icone = Rocket, titulo, descricao }) {
  return (
    <div className="animar-entrada flex flex-col items-center justify-center text-center px-6 py-14 border border-dashed border-line rounded-2xl bg-surface/50">
      <div className="w-14 h-14 rounded-2xl bg-paper flex items-center justify-center mb-4">
        <Icone size={22} className="text-ink-faint" />
      </div>
      {titulo && <p className="text-sm font-semibold text-ink mb-1">{titulo}</p>}
      {descricao && <p className="text-sm text-ink-soft max-w-xs">{descricao}</p>}
    </div>
  )
}
