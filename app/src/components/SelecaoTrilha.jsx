import { Languages, Stethoscope, Briefcase, Mic2, Rocket } from 'lucide-react'

export const TRILHAS = [
  { id: 'english', nome: 'English', icone: Languages, cor: 'amber', ativa: true },
  { id: 'spanish', nome: 'Spanish', icone: Languages, cor: 'teal', ativa: false },
  { id: 'medicine', nome: 'Medicine', icone: Stethoscope, cor: 'teal', ativa: false },
  { id: 'business', nome: 'Business', icone: Briefcase, cor: 'teal', ativa: false },
  { id: 'speech', nome: 'Speech', icone: Mic2, cor: 'teal', ativa: false },
]

export function SelecaoTrilha({ onSelecionar }) {
  return (
    <div className="animar-entrada">
      <h2 className="font-display text-lg font-semibold text-ink mb-1">Choose your track</h2>
      <p className="text-sm text-ink-soft mb-4">Pick what you want to learn.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRILHAS.map((t) => {
          const Icone = t.icone
          return (
            <button
              key={t.id}
              onClick={() => onSelecionar(t)}
              className="pressionavel flex items-center gap-4 bg-surface border border-line rounded-2xl p-5 hover:border-amber/40 hover:shadow-card transition text-left"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${t.ativa ? 'bg-amber-soft' : 'bg-paper'}`}>
                <Icone size={20} className={t.ativa ? 'text-amber' : 'text-ink-faint'} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-ink">{t.nome}</p>
                <p className="text-xs text-ink-soft mt-0.5">{t.ativa ? 'Available now' : 'Coming soon'}</p>
              </div>
              {!t.ativa && <Rocket size={15} className="text-ink-faint shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
