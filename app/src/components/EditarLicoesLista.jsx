import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BookOpenText, Edit3 } from 'lucide-react'
import { Carregando } from './Carregando'

export function EditarLicoesLista({ onSelecionar }) {
  const [licoes, setLicoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await supabase
        .from('materiais_aula')
        .select('nivel, licao, titulo, atualizado_em')
        .order('nivel')
        .order('licao')
      setLicoes(data || [])
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) return <Carregando />

  if (licoes.length === 0) {
    return (
      <div className="border border-dashed border-line rounded-2xl px-6 py-12 text-center">
        <BookOpenText size={28} className="mx-auto mb-3 text-ink-soft/40" />
        <p className="text-sm text-ink-soft">Nenhuma lição com material criado ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {licoes.map((l) => (
        <button key={`${l.nivel}-${l.licao}`} onClick={() => onSelecionar(l.nivel, l.licao)}
          className="w-full flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3 hover:border-amber/40 hover:shadow-card transition text-left">
          <div className="w-9 h-9 rounded-lg bg-paper flex items-center justify-center shrink-0">
            <BookOpenText size={16} className="text-navy" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{l.titulo}</p>
            <p className="text-xs text-ink-soft font-mono mt-0.5">{l.nivel} · lição {String(l.licao).padStart(2, '0')}</p>
          </div>
          <Edit3 size={15} className="text-ink-soft shrink-0" />
        </button>
      ))}
    </div>
  )
}
