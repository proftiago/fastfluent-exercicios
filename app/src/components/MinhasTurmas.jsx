import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CorrigirTentativa } from './CorrigirTentativa'
import { MenuSecoesLicao } from './MenuSecoesLicao'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { Clock, CheckCircle2, Users, BookOpenText, ListChecks } from 'lucide-react'

export function MinhasTurmas({ professorId }) {
  const [turmas, setTurmas] = useState([])
  const [turmaSel, setTurmaSel] = useState(null)
  const [progresso, setProgresso] = useState(null)
  const [tentativas, setTentativas] = useState([])
  const [exerciciosPorId, setExerciciosPorId] = useState({})
  const [tentativaAberta, setTentativaAberta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abaTurma, setAbaTurma] = useState('correcao') // 'correcao' | 'material'
  const [secaoMaterial, setSecaoMaterial] = useState(null)

  useEffect(() => {
    supabase.from('turmas').select('id, nome, nivel').eq('professor_id', professorId).then(({ data }) => {
      setTurmas(data || [])
      setCarregando(false)
    })
  }, [professorId])

  async function abrirTurma(turma) {
    setTurmaSel(turma)
    setTentativaAberta(null)
    setAbaTurma('correcao')
    setSecaoMaterial(null)

    const { data: prog } = await supabase.from('turma_progresso').select('licao_atual').eq('turma_id', turma.id).maybeSingle()
    setProgresso(prog)

    const { data: mats } = await supabase.from('matriculas').select('cliente_id, clientes(nome)').eq('turma_id', turma.id).eq('status', 'ativa')
    const clienteIds = (mats || []).map((m) => m.cliente_id)
    const nomesPorCliente = Object.fromEntries((mats || []).map((m) => [m.cliente_id, m.clientes?.nome || '—']))

    const { data: tents } = await supabase.from('tentativas').select('*').in('cliente_id', clienteIds.length ? clienteIds : [-1])
    const exIds = [...new Set((tents || []).map((t) => t.exercicio_id))]
    const { data: exs } = await supabase.from('exercicios').select('*').in('id', exIds.length ? exIds : [-1])
    const exMap = Object.fromEntries((exs || []).map((e) => [e.id, e]))

    setExerciciosPorId(exMap)
    setTentativas((tents || []).map((t) => ({ ...t, aluno_nome: nomesPorCliente[t.cliente_id] })))
  }

  if (carregando) return <Carregando />

  if (turmas.length === 0) {
    return <EstadoVazio icone={Users} titulo="No classes yet" descricao="As soon as a class is linked to you, it will show up here." />
  }

  if (!turmaSel) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {turmas.map((t) => (
          <button key={t.id} onClick={() => abrirTurma(t)} className="text-left p-4 rounded-2xl border border-line bg-surface hover:shadow-card transition">
            <p className="font-display text-sm font-semibold text-ink">{t.nome}</p>
            <p className="text-xs text-ink-soft font-mono mt-0.5">{t.nivel}</p>
          </button>
        ))}
      </div>
    )
  }

  if (tentativaAberta) {
    const exercicio = exerciciosPorId[tentativaAberta.exercicio_id]
    return (
      <CorrigirTentativa
        tentativa={tentativaAberta}
        exercicio={exercicio}
        onCorrigido={() => { setTentativaAberta(null); abrirTurma(turmaSel) }}
        onCancelar={() => setTentativaAberta(null)}
      />
    )
  }

  const pendentes = tentativas.filter((t) => t.status === 'pendente')
  const corrigidas = tentativas.filter((t) => t.status !== 'pendente')

  return (
    <div className="space-y-6">
      <button onClick={() => setTurmaSel(null)} className="text-sm text-ink-soft hover:text-ink transition">← Classes</button>
      <h2 className="font-display text-lg font-semibold text-ink">{turmaSel.nome}</h2>

      <div className="inline-flex bg-paper border border-line rounded-full p-1">
        <button
          onClick={() => setAbaTurma('correcao')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
            abaTurma === 'correcao' ? 'bg-navy text-white shadow-sm' : 'text-ink-soft hover:text-ink'
          }`}>
          <ListChecks size={15} /> Grading
        </button>
        <button
          onClick={() => { setAbaTurma('material'); setSecaoMaterial(null) }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
            abaTurma === 'material' ? 'bg-navy text-white shadow-sm' : 'text-ink-soft hover:text-ink'
          }`}>
          <BookOpenText size={15} /> Class Material
        </button>
      </div>

      {abaTurma === 'material' && (
        progresso?.licao_atual
          ? <MenuSecoesLicao nivel={turmaSel.nivel} licao={progresso.licao_atual} audiencia="professor" secaoSel={secaoMaterial} onSelecionarSecao={setSecaoMaterial} />
          : <EstadoVazio titulo="No current lesson yet" descricao="Advance this class's lesson in Gestão to unlock the material here." />
      )}

      {abaTurma === 'correcao' && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">Pending ({pendentes.length})</h3>
            {pendentes.length === 0 && <p className="text-sm text-ink-faint">Nothing pending.</p>}
            <div className="space-y-2">
              {pendentes.map((t) => (
                <button key={t.id} onClick={() => setTentativaAberta(t)} className="w-full flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 text-left hover:border-amber/40 transition">
                  <div>
                    <p className="text-sm font-medium text-ink">{t.aluno_nome}</p>
                    <p className="text-xs text-ink-soft">{exerciciosPorId[t.exercicio_id]?.titulo}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-amber-soft text-amber shrink-0"><Clock size={12} /> grade</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">Graded ({corrigidas.length})</h3>
            <div className="space-y-2">
              {corrigidas.map((t) => (
                <button key={t.id} onClick={() => setTentativaAberta(t)} className="w-full flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 text-left hover:border-teal/40 transition">
                  <div>
                    <p className="text-sm font-medium text-ink">{t.aluno_nome}</p>
                    <p className="text-xs text-ink-soft">{exerciciosPorId[t.exercicio_id]?.titulo}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-teal-soft text-teal shrink-0"><CheckCircle2 size={12} /> grade {t.nota}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
