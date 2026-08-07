import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CorrigirTentativa } from './CorrigirTentativa'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { CheckCircle2, ClipboardList } from 'lucide-react'

export function CorrecoesRecentes({ professorId }) {
  const [linhas, setLinhas] = useState([])
  const [exerciciosPorId, setExerciciosPorId] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [tentativaAberta, setTentativaAberta] = useState(null)

  async function carregar() {
    setCarregando(true)
    const { data: turmas } = await supabase.from('turmas').select('id, nome').eq('professor_id', professorId)
    const turmaIds = (turmas || []).map((t) => t.id)
    const nomesPorTurma = Object.fromEntries((turmas || []).map((t) => [t.id, t.nome]))

    const { data: mats } = await supabase
      .from('matriculas')
      .select('cliente_id, turma_id, clientes(nome)')
      .in('turma_id', turmaIds.length ? turmaIds : [-1])
      .eq('status', 'ativa')

    const clienteIds = (mats || []).map((m) => m.cliente_id)
    const infoPorCliente = Object.fromEntries((mats || []).map((m) => [m.cliente_id, { nome: m.clientes?.nome || '—', turma: nomesPorTurma[m.turma_id] }]))

    const { data: tents } = await supabase
      .from('tentativas')
      .select('*')
      .in('cliente_id', clienteIds.length ? clienteIds : [-1])
      .neq('status', 'pendente')
      .order('respondido_em', { ascending: false })
      .limit(20)

    const exIds = [...new Set((tents || []).map((t) => t.exercicio_id))]
    const { data: exs } = await supabase.from('exercicios').select('*').in('id', exIds.length ? exIds : [-1])
    const exMap = Object.fromEntries((exs || []).map((e) => [e.id, e]))

    setExerciciosPorId(exMap)
    setLinhas((tents || []).map((t) => ({ ...t, info: infoPorCliente[t.cliente_id] })))
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [professorId])

  if (carregando) return <Carregando />

  if (tentativaAberta) {
    const exercicio = exerciciosPorId[tentativaAberta.exercicio_id]
    return (
      <CorrigirTentativa
        tentativa={tentativaAberta}
        exercicio={exercicio}
        onCorrigido={() => { setTentativaAberta(null); carregar() }}
        onCancelar={() => setTentativaAberta(null)}
      />
    )
  }

  if (linhas.length === 0) {
    return <EstadoVazio icone={ClipboardList} titulo="No corrections yet" descricao="Once you grade a homework, it will show up here for quick review." />
  }

  return (
    <div className="space-y-2">
      {linhas.map((t) => (
        <button key={t.id} onClick={() => setTentativaAberta(t)}
          className="w-full flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 text-left hover:border-teal/40 hover:shadow-card transition">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{t.info?.nome}</p>
            <p className="text-xs text-ink-soft truncate">{exerciciosPorId[t.exercicio_id]?.titulo} · {t.info?.turma}</p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-teal-soft text-teal shrink-0 ml-2">
            <CheckCircle2 size={12} /> {t.nota ?? '—'}
          </span>
        </button>
      ))}
    </div>
  )
}
