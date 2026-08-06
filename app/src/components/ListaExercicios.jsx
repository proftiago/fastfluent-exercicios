import { useEffect, useState } from 'react'
import { EstadoVazio } from './EstadoVazio'
import { ListChecks } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { ResponderExercicio } from './ResponderExercicio'
import { VisualizarTentativa } from './VisualizarTentativa'
import { Comemoracao } from './Comemoracao'
import { MessageCircleQuestion, BookOpenText, Shuffle, CheckCircle2, Clock } from 'lucide-react'
import { Carregando } from './Carregando'

const ICONES = { perguntas_respostas: MessageCircleQuestion, interpretacao_texto: BookOpenText, criar_perguntas: Shuffle }

export function ListaExercicios({ clienteId, nivel, licao }) {
  const [exercicios, setExercicios] = useState([])
  const [tentativas, setTentativas] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [abertoId, setAbertoId] = useState(null)
  const [comemoracao, setComemoracao] = useState(null)

  async function carregar() {
    setCarregando(true)
    let q = supabase
      .from('exercicios')
      .select('id, titulo, tipo, nivel, licao, prazo, conteudo, ordem')
    if (nivel) q = q.eq('nivel', nivel)
    if (licao) q = q.eq('licao', licao)
    q = nivel && licao ? q.order('ordem', { ascending: true, nullsFirst: false }) : q.order('criado_em', { ascending: false })

    const { data: ex } = await q

    const { data: tent } = await supabase
      .from('tentativas')
      .select('exercicio_id, status, nota, feedback, resposta, correcao_itens')

    const novosExercicios = ex || []
    const novasTentativas = Object.fromEntries((tent || []).map((t) => [t.exercicio_id, t]))

    setExercicios(novosExercicios)
    setTentativas(novasTentativas)
    setCarregando(false)

    return { exercicios: novosExercicios, tentativas: novasTentativas }
  }

  useEffect(() => { carregar() }, [nivel, licao])

  async function handleEnviado(atividade) {
    setAbertoId(null)
    const { exercicios: novosEx, tentativas: novasTent } = await carregar()
    const todasRespondidas = novosEx.length > 0 && novosEx.every((e) => novasTent[e.id])

    if (todasRespondidas) {
      setComemoracao({
        titulo: 'Lesson complete! 🚀',
        descricao: atividade
          ? `You've submitted everything here. Streak: ${atividade.streak_atual} day${atividade.streak_atual !== 1 ? 's' : ''} · ${atividade.xp_total} total XP.`
          : "You've submitted everything here.",
      })
    } else if (atividade?.streak_aumentou) {
      setComemoracao({
        titulo: `🔥 ${atividade.streak_atual} day${atividade.streak_atual !== 1 ? 's' : ''} streak!`,
        descricao: `Keep it up — you already have ${atividade.xp_total} XP.`,
      })
    }
  }

  if (carregando) return <Carregando linhas={2} />

  if (exercicios.length === 0) {
    return (
      <EstadoVazio icone={ListChecks} titulo="No exercises here yet" descricao="Check back later — new exercises may show up anytime." />
    )
  }

  const tarefas = exercicios.filter((e) => e.prazo)
  const extras = exercicios.filter((e) => !e.prazo)

  function renderGrupo(titulo, lista) {
    if (lista.length === 0) return null
    return (
      <div className="space-y-2">
        <h3 className="font-display text-sm font-semibold text-ink-soft uppercase tracking-wide">{titulo}</h3>
        <div className="space-y-2">
          {lista.map((ex) => {
            const Icon = ICONES[ex.tipo]
            const tentativa = tentativas[ex.id]
            const aberto = abertoId === ex.id

            return (
              <div key={ex.id} className="bg-surface rounded-2xl border border-line overflow-hidden">
                <button
                  onClick={() => setAbertoId(aberto ? null : ex.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-paper flex items-center justify-center text-navy shrink-0">
                    <Icon size={15} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{ex.titulo}</p>
                    <p className="text-xs text-ink-soft font-mono mt-0.5">
                      {ex.nivel} · lição {String(ex.licao).padStart(2, '0')} {ex.prazo && `· due ${ex.prazo}`}
                    </p>
                  </div>
                  {tentativa ? (
                    tentativa.status === 'pendente' ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-amber-soft text-amber shrink-0">
                        <Clock size={12} /> awaiting grading
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-teal-soft text-teal shrink-0">
                        <CheckCircle2 size={12} /> grade {tentativa.nota ?? '—'}
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-paper text-ink-soft shrink-0">
                      answer
                    </span>
                  )}
                </button>

                {aberto && (
                  <div className="px-5 pb-5">
                    {tentativa ? (
                      <VisualizarTentativa exercicio={ex} tentativa={tentativa} />
                    ) : (
                      <ResponderExercicio
                        exercicio={ex}
                        clienteId={clienteId}
                        onEnviado={handleEnviado}
                        onCancelar={() => setAbertoId(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderGrupo('Homework', tarefas)}
      {renderGrupo('Extra Exercises', extras)}
      {comemoracao && <Comemoracao {...comemoracao} onFechar={() => setComemoracao(null)} />}
    </div>
  )
}
