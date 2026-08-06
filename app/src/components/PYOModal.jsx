import { X, Volume2 } from 'lucide-react'

function falar(texto) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

export function PYOModal({ parte, onFechar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 backdrop-blur-sm px-4">
      <div className="animar-entrada bg-surface rounded-3xl shadow-card-teal border border-teal/30 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <p className="text-[11px] font-semibold text-teal uppercase tracking-wide">Practice on Your Own</p>
            <p className="text-sm text-ink-soft mt-0.5">{parte?.nome}</p>
          </div>
          <button onClick={onFechar} className="text-ink-faint hover:text-ink-soft transition">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-1.5">
          {(parte?.frases_repetir || []).map((frase) => (
            <button key={frase.id} onClick={() => falar(frase.texto)}
              className="pressionavel w-full flex items-center gap-2 border border-teal/25 bg-teal-soft/50 rounded-lg p-2.5 hover:border-teal/50 transition text-left">
              <Volume2 size={14} className="text-teal shrink-0" />
              <span className="text-sm text-ink flex-1">{frase.texto}</span>
            </button>
          ))}
          {(!parte?.frases_repetir || parte.frases_repetir.length === 0) && (
            <p className="text-sm text-ink-faint text-center py-6">No practice phrases for this section.</p>
          )}
        </div>
      </div>
    </div>
  )
}
