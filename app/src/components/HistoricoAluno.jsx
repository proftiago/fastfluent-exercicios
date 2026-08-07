import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { Printer, CheckCircle2, XCircle, Calendar } from 'lucide-react'

export function HistoricoAluno({ clienteId, nomeAluno }) {
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarDeclaracao, setMostrarDeclaracao] = useState(false)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data: mats } = await supabase
        .from('matriculas')
        .select('id, turma_id, turmas(nome, nivel)')
        .eq('cliente_id', clienteId)

      const matriculaIds = (mats || []).map((m) => m.id)
      if (matriculaIds.length === 0) { setRegistros([]); setCarregando(false); return }

      const turmaPorMatricula = Object.fromEntries((mats || []).map((m) => [m.id, m.turmas]))

      const { data: freq } = await supabase
        .from('frequencia')
        .select('id, presente, observacao, avaliacao, nota, matricula_id, aulas(data, descricao, licao, nivel)')
        .in('matricula_id', matriculaIds)

      const linhas = (freq || [])
        .map((f) => ({ ...f, turma: turmaPorMatricula[f.matricula_id] }))
        .filter((f) => f.aulas)
        .sort((a, b) => new Date(b.aulas.data) - new Date(a.aulas.data))

      setRegistros(linhas)
      setCarregando(false)
    }
    carregar()
  }, [clienteId])

  if (carregando) return <Carregando linhas={3} />

  if (registros.length === 0) {
    return <EstadoVazio icone={Calendar} titulo="No classes recorded yet" descricao="Once your teacher takes attendance, it will show up here." />
  }

  const totalAulas = registros.length
  const totalPresencas = registros.filter((r) => r.presente === 1).length
  const percentualPresenca = Math.round((totalPresencas / totalAulas) * 100)
  const notas = registros.filter((r) => r.nota !== null && r.nota !== undefined)
  const mediaNota = notas.length ? (notas.reduce((s, r) => s + Number(r.nota), 0) / notas.length).toFixed(1) : null

  return (
    <div className="animar-entrada space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-line rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-ink">{totalAulas}</p>
          <p className="text-[10px] text-ink-soft">classes</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-teal">{percentualPresenca}%</p>
          <p className="text-[10px] text-ink-soft">attendance</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-amber">{mediaNota ?? '—'}</p>
          <p className="text-[10px] text-ink-soft">avg. grade</p>
        </div>
      </div>

      <button onClick={() => setMostrarDeclaracao(true)}
        className="pressionavel w-full flex items-center justify-center gap-2 bg-navy text-white text-sm font-medium py-3 rounded-xl hover:bg-navy-deep transition">
        <Printer size={16} /> Print / Download Statement
      </button>

      <div className="space-y-2">
        {registros.map((r) => (
          <div key={r.id} className="bg-surface border border-line rounded-xl px-4 py-3 flex items-center gap-3">
            {r.presente === 1 ? (
              <CheckCircle2 size={18} className="text-teal shrink-0" />
            ) : (
              <XCircle size={18} className="text-red-400 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                {new Date(r.aulas.data).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-ink-soft font-mono mt-0.5">
                {r.aulas.nivel} · Lesson {String(r.aulas.licao).padStart(2, '0')}
              </p>
              {r.observacao && <p className="text-xs text-ink-faint mt-1">{r.observacao}</p>}
            </div>
            <div className="text-right shrink-0">
              {r.avaliacao && <p className="text-xs font-medium text-teal">{r.avaliacao}</p>}
              {r.nota !== null && r.nota !== undefined && <p className="text-sm font-bold text-ink">{r.nota}</p>}
            </div>
          </div>
        ))}
      </div>

      {mostrarDeclaracao && (
        <DeclaracaoModal
          nomeAluno={nomeAluno}
          registros={registros}
          totalAulas={totalAulas}
          totalPresencas={totalPresencas}
          percentualPresenca={percentualPresenca}
          mediaNota={mediaNota}
          onFechar={() => setMostrarDeclaracao(false)}
        />
      )}
    </div>
  )
}

function DeclaracaoModal({ nomeAluno, registros, totalAulas, totalPresencas, percentualPresenca, mediaNota, onFechar }) {
  const primeira = registros[registros.length - 1]?.aulas?.data
  const ultima = registros[0]?.aulas?.data
  const nivel = registros[0]?.aulas?.nivel
  const turmaNome = registros[0]?.turma?.nome

  function formatarData(d) {
    return d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-sm flex items-center justify-center px-4 print:bg-white print:backdrop-blur-none print:px-0">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-2xl max-h-[85vh] overflow-y-auto print:max-h-none print:rounded-none print:shadow-none print:max-w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line print:hidden">
          <p className="text-sm font-semibold text-ink">Performance Statement</p>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs font-medium bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy-deep transition">Print / Save as PDF</button>
            <button onClick={onFechar} className="text-xs font-medium text-ink-soft px-3 py-1.5">Close</button>
          </div>
        </div>

        <div className="p-8 sm:p-10 text-[#0D1424]" style={{ fontFamily: 'Georgia, serif' }}>
          <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: '#16233F' }}>
            <p className="text-2xl font-bold" style={{ color: '#16233F' }}>Fast Fluent Idiomas</p>
            <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: '#EFA036' }}>Certificate of Attendance &amp; Performance</p>
          </div>

          <p className="text-sm leading-relaxed mb-6">
            This document certifies that <strong>{nomeAluno}</strong> has attended English classes
            {turmaNome ? <> in class <strong>{turmaNome}</strong></> : null}
            {nivel ? <>, book <strong>{nivel}</strong></> : null}, from <strong>{formatarData(primeira)}</strong> to <strong>{formatarData(ultima)}</strong>,
            with the following performance summary.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center border rounded-lg py-3" style={{ borderColor: '#E1E5EE' }}>
              <p className="text-xl font-bold" style={{ color: '#16233F' }}>{totalAulas}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Classes recorded</p>
            </div>
            <div className="text-center border rounded-lg py-3" style={{ borderColor: '#E1E5EE' }}>
              <p className="text-xl font-bold" style={{ color: '#279B87' }}>{percentualPresenca}%</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Attendance ({totalPresencas}/{totalAulas})</p>
            </div>
            <div className="text-center border rounded-lg py-3" style={{ borderColor: '#E1E5EE' }}>
              <p className="text-xl font-bold" style={{ color: '#EFA036' }}>{mediaNota ?? '—'}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Average grade</p>
            </div>
          </div>

          <table className="w-full text-xs mb-8 border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #16233F' }}>
                <th className="text-left py-2 font-semibold">Date</th>
                <th className="text-left py-2 font-semibold">Lesson</th>
                <th className="text-center py-2 font-semibold">Attendance</th>
                <th className="text-left py-2 font-semibold">Evaluation</th>
                <th className="text-right py-2 font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {[...registros].reverse().map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #E1E5EE' }}>
                  <td className="py-1.5">{formatarData(r.aulas.data)}</td>
                  <td className="py-1.5">{r.aulas.nivel} · L{String(r.aulas.licao).padStart(2, '0')}</td>
                  <td className="py-1.5 text-center">{r.presente === 1 ? 'Present' : 'Absent'}</td>
                  <td className="py-1.5">{r.avaliacao || '—'}</td>
                  <td className="py-1.5 text-right">{r.nota ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-12 pt-6 border-t" style={{ borderColor: '#E1E5EE' }}>
            <div className="text-[10px] text-gray-400">
              Generated on {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })} · Fast Fluent Idiomas
            </div>
            <div className="text-right">
              <div className="w-40 border-t mb-1" style={{ borderColor: '#0D1424' }} />
              <p className="text-[10px] text-gray-500">Authorized signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
