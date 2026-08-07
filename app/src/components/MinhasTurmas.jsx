import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CorrigirTentativa } from './CorrigirTentativa'
import { MenuSecoesLicao } from './MenuSecoesLicao'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { Clock, CheckCircle2, Users, BookOpenText, ListChecks, Search, Download } from 'lucide-react'

export function MinhasTurmas({ professorId }) {
  const [turmas, setTurmas] = useState([])
  const [turmaSel, setTurmaSel] = useState(null)
  const [progresso, setProgresso] = useState(null)
  const [tentativas, setTentativas] = useState([])
  const [frequencia, setFrequencia] = useState([])
  const [exerciciosPorId, setExerciciosPorId] = useState({})
  const [tentativaAberta, setTentativaAberta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [abaTurma, setAbaTurma] = useState('correcao')
  const [secaoMaterial, setSecaoMaterial] = useState(null)
  const [busca, setBusca] = useState('')

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
    setBusca('')

    const { data: prog } = await supabase.from('turma_progresso').select('licao_atual').eq('turma_id', turma.id).maybeSingle()
    setProgresso(prog)

    const { data: mats } = await supabase.from('matriculas').select('id, cliente_id, clientes(nome)').eq('turma_id', turma.id).eq('status', 'ativa')
    const clienteIds = (mats || []).map((m) => m.cliente_id)
    const matriculaIds = (mats || []).map((m) => m.id)
    const nomesPorCliente = Object.fromEntries((mats || []).map((m) => [m.cliente_id, m.clientes?.nome || '—']))
    const nomesPorMatricula = Object.fromEntries((mats || []).map((m) => [m.id, m.clientes?.nome || '—']))

    const { data: tents } = await supabase.from('tentativas').select('*').in('cliente_id', clienteIds.length ? clienteIds : [-1])
    const exIds = [...new Set((tents || []).map((t) => t.exercicio_id))]
    const { data: exs } = await supabase.from('exercicios').select('*').in('id', exIds.length ? exIds : [-1])
    const exMap = Object.fromEntries((exs || []).map((e) => [e.id, e]))

    setExerciciosPorId(exMap)
    setTentativas((tents || []).map((t) => ({ ...t, aluno_nome: nomesPorCliente[t.cliente_id] })))

    const { data: freq } = await supabase
      .from('frequencia')
      .select('presente, avaliacao, nota, matricula_id, aulas(data)')
      .in('matricula_id', matriculaIds.length ? matriculaIds : [-1])
    setFrequencia((freq || []).map((f) => ({ ...f, aluno_nome: nomesPorMatricula[f.matricula_id] })))
  }

  function exportarCSV() {
    const linhas = [['Aluno', 'Data', 'Presença', 'Avaliação', 'Nota']]
    frequencia
      .slice()
      .sort((a, b) => (a.aluno_nome || '').localeCompare(b.aluno_nome || ''))
      .forEach((f) => {
        linhas.push([
          f.aluno_nome || '',
          f.aulas?.data || '',
          f.presente === 1 ? 'Presente' : 'Ausente',
          f.avaliacao || '',
          f.nota ?? '',
        ])
      })
    const csv = linhas.map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frequencia-${turmaSel.nome.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

  const buscaLower = busca.trim().toLowerCase()
  const filtrar = (t) => !buscaLower || (t.aluno_nome || '').toLowerCase().includes(buscaLower)
  const pendentes = tentativas.filter((t) => t.status === 'pendente').filter(filtrar)
  const corrigidas = tentativas.filter((t) => t.status !== 'pendente').filter(filtrar)

  return (
    <div className="space-y-6">
      <button onClick={() => setTurmaSel(null)} className="text-sm text-ink-soft hover:text-ink transition">← Classes</button>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display text-lg font-semibold text-ink">{turmaSel.nome}</h2>
        <button onClick={exportarCSV} disabled={frequencia.length === 0}
          className="pressionavel flex items-center gap-1.5 text-xs font-medium bg-paper text-navy px-3 py-2 rounded-lg hover:bg-line disabled:opacity-40 transition">
          <Download size={13} /> Export attendance (CSV)
        </button>
      </div>

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
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Search student..."
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50" />
          </div>

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
