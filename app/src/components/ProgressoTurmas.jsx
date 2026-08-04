import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { TrilhaLicoes } from './TrilhaLicoes'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { Users } from 'lucide-react'

export function ProgressoTurmas() {
  const { session } = useAuth()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(null)

  async function carregar() {
    setCarregando(true)
    const { data: turmas } = await supabase.from('turmas').select('id, nome, nivel').eq('status', 'ativa').order('nivel')
    const { data: progresso } = await supabase.from('turma_progresso').select('turma_id, licao_atual')
    const progressoPorTurma = Object.fromEntries((progresso || []).map((p) => [p.turma_id, p.licao_atual]))

    setLinhas((turmas || []).map((t) => ({ ...t, licao_atual: progressoPorTurma[t.id] ?? 0 })))
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function avancarLicao(turmaId, novaLicao) {
    if (novaLicao < 0 || novaLicao > 18) return
    setAtualizando(turmaId)
    const { error } = await supabase.from('turma_progresso').upsert({
      turma_id: turmaId,
      licao_atual: novaLicao,
      atualizado_em: new Date().toISOString(),
      atualizado_por: session.user.id,
    })
    setAtualizando(null)
    if (!error) setLinhas((prev) => prev.map((l) => (l.id === turmaId ? { ...l, licao_atual: novaLicao } : l)))
  }

  if (carregando) return <Carregando />

  return (
    <div className="max-w-2xl w-full bg-surface rounded-2xl shadow-sm border border-line p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Progresso das turmas</h2>
        <p className="text-sm text-ink-soft mt-1">Consulta do que já foi liberado — o controle de verdade agora é feito pela Chamada no Gestão.</p>
      </div>

      {linhas.length === 0 && <EstadoVazio icone={Users} titulo="Nenhuma turma ativa" descricao="Cadastre turmas no Gestão pra acompanhar o progresso delas aqui." />}

      {linhas.map((t) => (
        <div key={t.id} className="border-t border-line pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">{t.nome}</p>
              <p className="font-mono text-xs text-ink-soft uppercase tracking-wide">{t.nivel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={atualizando === t.id || t.licao_atual <= 0}
                onClick={() => avancarLicao(t.id, t.licao_atual - 1)}
                className="w-7 h-7 rounded-full bg-paper text-ink-soft hover:bg-line disabled:opacity-30 transition"
              >−</button>
              <span className="w-20 text-center font-mono text-sm text-ink">
                {t.licao_atual === 0 ? '— · —' : `${t.licao_atual} / 18`}
              </span>
              <button
                disabled={atualizando === t.id || t.licao_atual >= 18}
                onClick={() => avancarLicao(t.id, t.licao_atual + 1)}
                className="w-7 h-7 rounded-full bg-amber-soft text-amber hover:bg-amber hover:text-white disabled:opacity-30 transition"
              >+</button>
            </div>
          </div>
          <TrilhaLicoes licaoAtual={t.licao_atual} />
        </div>
      ))}
    </div>
  )
}
