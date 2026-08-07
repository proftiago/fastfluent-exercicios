import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Carregando } from './Carregando'
import { Users, Flame, ListChecks, BookOpenText, TrendingUp } from 'lucide-react'

export function PainelAnalytics() {
  const [carregando, setCarregando] = useState(true)
  const [stats, setStats] = useState(null)
  const [topLicoes, setTopLicoes] = useState([])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)

      const { count: totalAlunos } = await supabase.from('aluno_contas').select('id', { count: 'exact', head: true })

      const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const { count: alunosAtivos } = await supabase.from('aluno_contas').select('id', { count: 'exact', head: true }).gte('ultima_atividade', seteDiasAtras)

      const { count: totalTentativas } = await supabase.from('tentativas').select('id', { count: 'exact', head: true })
      const { count: totalMateriais } = await supabase.from('materiais_aula').select('id', { count: 'exact', head: true })

      const { data: tentativasComExercicio } = await supabase
        .from('tentativas')
        .select('exercicio_id, exercicios(nivel, licao)')

      const contagem = {}
      ;(tentativasComExercicio || []).forEach((t) => {
        if (!t.exercicios) return
        const chave = `${t.exercicios.nivel} · Lição ${String(t.exercicios.licao).padStart(2, '0')}`
        contagem[chave] = (contagem[chave] || 0) + 1
      })
      const top = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5)

      setStats({ totalAlunos: totalAlunos || 0, alunosAtivos: alunosAtivos || 0, totalTentativas: totalTentativas || 0, totalMateriais: totalMateriais || 0 })
      setTopLicoes(top)
      setCarregando(false)
    }
    carregar()
  }, [])

  if (carregando) return <Carregando linhas={3} />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-line rounded-2xl p-4 text-center">
          <Users size={18} className="text-navy mx-auto mb-1.5" />
          <p className="text-xl font-bold text-ink">{stats.totalAlunos}</p>
          <p className="text-[11px] text-ink-soft">alunos com login</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 text-center">
          <Flame size={18} className="text-amber mx-auto mb-1.5" />
          <p className="text-xl font-bold text-ink">{stats.alunosAtivos}</p>
          <p className="text-[11px] text-ink-soft">ativos (7 dias)</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 text-center">
          <ListChecks size={18} className="text-teal mx-auto mb-1.5" />
          <p className="text-xl font-bold text-ink">{stats.totalTentativas}</p>
          <p className="text-[11px] text-ink-soft">exercícios enviados</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 text-center">
          <BookOpenText size={18} className="text-navy mx-auto mb-1.5" />
          <p className="text-xl font-bold text-ink">{stats.totalMateriais}</p>
          <p className="text-[11px] text-ink-soft">lições publicadas</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-amber" />
          <h2 className="font-display text-base font-semibold text-ink">Lições mais praticadas</h2>
        </div>
        {topLicoes.length === 0 && <p className="text-sm text-ink-faint">Ainda sem dados suficientes.</p>}
        <div className="space-y-2.5">
          {topLicoes.map(([nome, qtd], i) => {
            const max = topLicoes[0][1]
            return (
              <div key={nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink font-medium">{i + 1}. {nome}</span>
                  <span className="text-ink-soft">{qtd}</span>
                </div>
                <div className="h-2 bg-paper rounded-full overflow-hidden">
                  <div className="h-full bg-amber rounded-full" style={{ width: `${(qtd / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
