import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MessageCircleQuestion, BookOpenText, Shuffle, Trash2, Pencil } from 'lucide-react'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { ListChecks } from 'lucide-react'

const ICONES = { perguntas_respostas: MessageCircleQuestion, interpretacao_texto: BookOpenText, criar_perguntas: Shuffle }

export function MeusExercicios({ refreshKey, nivelFiltro, licaoFiltro, onExcluido, onEditar }) {
  const [exercicios, setExercicios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [excluindo, setExcluindo] = useState(null)

  async function carregar() {
    setCarregando(true)
    let q = supabase
      .from('exercicios')
      .select('id, titulo, tipo, nivel, licao, turma_id, prazo, publicado, conteudo, gabarito, criado_em, ordem')
      .order('criado_em', { ascending: false })
    if (nivelFiltro) q = q.eq('nivel', nivelFiltro)
    if (licaoFiltro) q = q.eq('licao', licaoFiltro)
    const { data, error } = await q
    if (!error) setExercicios((data || []).sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)))
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [refreshKey, nivelFiltro, licaoFiltro])

  async function excluir(ex) {
    const confirmar = window.confirm(`Apagar "${ex.titulo}"? Isso também apaga respostas de alunos que já enviaram esse exercício. Não dá pra desfazer.`)
    if (!confirmar) return
    setExcluindo(ex.id)
    const { error } = await supabase.from('exercicios').delete().eq('id', ex.id)
    setExcluindo(null)
    if (error) { alert(`Erro ao apagar: ${error.message}`); return }
    setExercicios((prev) => prev.filter((e) => e.id !== ex.id))
    onExcluido?.()
  }

  if (carregando) return <Carregando linhas={2} />

  return (
    <div>
      <h2 className="font-display text-base font-semibold text-ink mb-3">
        Publicados {!carregando && <span className="text-ink-soft font-normal">({exercicios.length})</span>}
      </h2>

      {exercicios.length === 0 && (
        <EstadoVazio icone={ListChecks} titulo="Nenhum exercício publicado" descricao="Crie o primeiro ali em cima." />
      )}

      {exercicios.length > 0 && (
        <div className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
          {exercicios.map((ex) => {
            const Icon = ICONES[ex.tipo]
            return (
              <div key={ex.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-paper flex items-center justify-center text-navy shrink-0">
                  <Icon size={15} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{ex.titulo}</p>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">
                    {ex.nivel} · lição {String(ex.licao).padStart(2, '0')} {ex.prazo && `· prazo ${ex.prazo}`}
                  </p>
                </div>
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-teal-soft text-teal shrink-0">publicado</span>
                <button onClick={() => onEditar?.(ex)} className="text-ink-soft hover:text-navy transition shrink-0" title="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => excluir(ex)} disabled={excluindo === ex.id} className="text-ink-soft hover:text-red-500 disabled:opacity-40 transition shrink-0" title="Apagar">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
