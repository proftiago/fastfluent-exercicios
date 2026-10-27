import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MinhasTurmas } from './MinhasTurmas'
import { ConteudoProfessor } from './ConteudoProfessor'
import { Configuracoes } from './Configuracoes'
import { CorrecoesRecentes } from './CorrecoesRecentes'
import { LogOut, ChevronLeft, BookOpenText, Users, Bell, X, Settings, Camera, ClipboardCheck, ArrowRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import logoBranco from '../assets/logo-branco.png'

const CHAVE_ULTIMA_VISTA = 'ff_ultima_notif_vista'

export function AreaProfessor() {
  const { session, signOut } = useAuth()
  const { tema } = useTheme()
  const [professorId, setProfessorId] = useState(null)
  const [nome, setNome] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [tela, setTela] = useState(null) // null | 'conteudo' | 'turmas' | 'config'
  const [stats, setStats] = useState({ turmas: 0, pendentes: 0 })

  const [notificacoes, setNotificacoes] = useState([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)

  useEffect(() => {
    supabase.from('professor_contas').select('professor_id, avatar_url, professores(nome)').eq('auth_user_id', session.user.id).maybeSingle()
      .then(async ({ data }) => {
        setProfessorId(data?.professor_id ?? null)
        setNome(data?.professores?.nome ?? '')
        setAvatarUrl(data?.avatar_url ?? null)
        setCarregando(false)

        if (data?.professor_id) {
          const { data: turmas } = await supabase.from('turmas').select('id').eq('professor_id', data.professor_id)
          const turmaIds = (turmas || []).map((t) => t.id)
          let pendentes = 0
          if (turmaIds.length) {
            const { data: mats } = await supabase.from('matriculas').select('cliente_id').in('turma_id', turmaIds).eq('status', 'ativa')
            const clienteIds = (mats || []).map((m) => m.cliente_id)
            if (clienteIds.length) {
              const { count } = await supabase.from('tentativas').select('id', { count: 'exact', head: true }).in('cliente_id', clienteIds).eq('status', 'pendente')
              pendentes = count || 0
            }
          }
          setStats({ turmas: turmaIds.length, pendentes })
        }
      })
  }, [session])

  useEffect(() => {
    async function carregarNotificacoes() {
      const { data } = await supabase.from('notificacoes_professores').select('*').order('criado_em', { ascending: false }).limit(20)
      setNotificacoes(data || [])
      const ultimaVista = localStorage.getItem(CHAVE_ULTIMA_VISTA)
      const naoVistas = (data || []).filter((n) => !ultimaVista || new Date(n.criado_em) > new Date(ultimaVista))
      setNaoLidas(naoVistas.length)
    }
    carregarNotificacoes()
  }, [])

  function abrirNotificacoes() {
    setMostrarNotificacoes((v) => !v)
    if (notificacoes.length > 0) {
      localStorage.setItem(CHAVE_ULTIMA_VISTA, notificacoes[0].criado_em)
      setNaoLidas(0)
    }
  }

  const titulos = { conteudo: 'Class Content', turmas: 'My Classes', config: 'Settings', correcoes: 'Recent Corrections' }
  const titulo = tela === null ? 'Home' : titulos[tela]

  return (
    // mesmo visual Caderno do aluno: o tema claro/escuro do professor usa os tokens do aluno
    <div data-tema={tema === 'escuro' ? 'escuro' : 'claro'} className="min-h-screen bg-paper">
      <header className="bg-navy relative">
        <div className="max-w-2xl mx-auto px-4 py-5 flex justify-between items-center">
          <div>
            <img src={logoBranco} alt="Fast Fluent" className="h-4 w-auto mb-1" />
            <h1 className="font-display text-xl font-semibold text-white">{titulo}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={abrirNotificacoes} className="relative text-white/70 hover:text-white transition">
              <Bell size={20} />
              {naoLidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber text-navy-deep text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>
            <button onClick={signOut} className="text-white/70 hover:text-white transition"><LogOut size={18} /></button>
          </div>
        </div>

        {mostrarNotificacoes && (
          <div className="absolute right-4 top-16 w-80 max-w-[90vw] bg-surface rounded-2xl shadow-card border border-line z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="text-sm font-semibold text-ink">Updates</p>
              <button onClick={() => setMostrarNotificacoes(false)} className="text-ink-soft hover:text-ink"><X size={16} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notificacoes.length === 0 && (
                <p className="text-sm text-ink-soft px-4 py-6 text-center">No updates yet.</p>
              )}
              {notificacoes.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-line last:border-b-0">
                  <p className="text-sm text-ink">{n.mensagem}</p>
                  <p className="text-[11px] text-ink-soft mt-1">{new Date(n.criado_em).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {carregando && <p className="text-sm text-ink-soft">Carregando...</p>}

        {!carregando && !professorId && (
          <div className="border border-dashed border-line rounded-2xl px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">Your account isn't linked to a teacher record. Please contact the coordination team.</p>
          </div>
        )}

        {!carregando && professorId && tela === null && (
          <div className="animar-entrada">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-sm text-ink-soft">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p className="font-display text-3xl font-semibold text-ink mt-1">Hi, {(nome || 'teacher').split(' ')[0]}.</p>
              </div>
              <button onClick={() => setTela('config')} aria-label="Settings" className="w-11 h-11 rounded-full bg-navy overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={16} className="text-white/70" />}
              </button>
            </div>

            <button onClick={() => setTela(stats.pendentes > 0 ? 'turmas' : 'conteudo')}
              className="pressionavel relative w-full h-56 rounded-3xl overflow-hidden mb-4 text-left shadow-card block bg-[#0E1733]">
              <img src="/capas/ignition.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" onError={(e) => { e.target.style.display = 'none' }} />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0E1733] via-[#0E1733]/40 to-transparent" />
              <span className="absolute left-5 right-5 bottom-5 flex items-end justify-between gap-3">
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-widest text-[#F3D58C]">{stats.pendentes > 0 ? 'To grade' : 'Class content'}</span>
                  <span className="block font-display text-[26px] leading-tight font-semibold text-white mt-1">
                    {stats.pendentes > 0 ? `${stats.pendentes} ${stats.pendentes === 1 ? 'answer' : 'answers'} waiting` : 'Plan your next class'}
                  </span>
                </span>
                <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shrink-0">
                  <ArrowRight size={20} className="text-[#14213D]" />
                </span>
              </span>
            </button>

            <div className="grid grid-cols-4 gap-2.5 mb-6">
              {[
                { nome: 'Content', Icone: BookOpenText, ir: 'conteudo' },
                { nome: 'My classes', Icone: Users, ir: 'turmas' },
                { nome: 'Graded', Icone: ClipboardCheck, ir: 'correcoes' },
                { nome: 'Settings', Icone: Settings, ir: 'config' },
              ].map(({ nome: n, Icone, ir }) => (
                <button key={ir} onClick={() => setTela(ir)}
                  className="pressionavel aspect-square rounded-2xl bg-surface shadow-card flex flex-col items-center justify-center gap-2">
                  <Icone size={24} className="text-ink" />
                  <span className="text-[12px] font-medium text-ink">{n}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-5 pb-4 border-b border-line">
              {[[stats.turmas, stats.turmas === 1 ? 'class' : 'classes'], [stats.pendentes, 'to grade'], [naoLidas, 'new updates']].map(([v, r], i) => (
                <div key={r} className={i ? 'pl-5 border-l border-line' : ''}>
                  <p className="font-display text-2xl font-semibold text-ink">{v}</p>
                  <p className="text-xs text-ink-soft">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!carregando && professorId && tela !== null && (
          <div className="animar-entrada" key={tela}>
            <button onClick={() => setTela(null)} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4 transition">
              <ChevronLeft size={16} /> Home
            </button>
            {tela === 'conteudo' && <ConteudoProfessor />}
            {tela === 'turmas' && <MinhasTurmas professorId={professorId} />}
            {tela === 'correcoes' && <CorrecoesRecentes professorId={professorId} />}
            {tela === 'config' && (
              <Configuracoes avatarUrl={avatarUrl} onAvatarAtualizado={setAvatarUrl} tabela="professor_contas" />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
