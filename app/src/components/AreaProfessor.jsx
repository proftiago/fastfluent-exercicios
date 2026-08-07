import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MinhasTurmas } from './MinhasTurmas'
import { ConteudoProfessor } from './ConteudoProfessor'
import { Configuracoes } from './Configuracoes'
import { CorrecoesRecentes } from './CorrecoesRecentes'
import { LogOut, ChevronLeft, BookOpenText, Users, Bell, X, Settings, Camera, Rocket, Sparkles, Flame, Star, ClipboardCheck } from 'lucide-react'
import logoBranco from '../assets/logo-branco.png'

const CHAVE_ULTIMA_VISTA = 'ff_ultima_notif_vista'

export function AreaProfessor() {
  const { session, signOut } = useAuth()
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
    <div className="min-h-screen bg-paper">
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
          <div className="space-y-4 animar-entrada">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy to-navy-deep shadow-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={16} className="text-white/50" />}
                </div>
                <div>
                  <img src={logoBranco} alt="Fast Fluent" className="h-3.5 w-auto mb-1" />
                  <h2 className="font-display text-xl font-bold text-white">Hi, {nome || 'teacher'}!</h2>
                </div>
              </div>
              <p className="text-sm text-white/70 mt-3 mb-4">Choose what you need right now.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.06] rounded-2xl px-4 py-3">
                  <p className="text-lg font-bold text-white">{stats.turmas}</p>
                  <p className="text-[11px] text-white/50">{stats.turmas === 1 ? 'class' : 'classes'}</p>
                </div>
                <div className="bg-white/[0.06] rounded-2xl px-4 py-3">
                  <p className="text-lg font-bold text-amber">{stats.pendentes}</p>
                  <p className="text-[11px] text-white/50">to grade</p>
                </div>
              </div>
            </div>

            <button onClick={() => setTela('conteudo')}
              className="w-full flex items-center gap-4 bg-surface border border-line rounded-2xl p-5 hover:border-amber/40 hover:shadow-card transition text-left">
              <div className="w-11 h-11 rounded-xl bg-amber-soft flex items-center justify-center shrink-0">
                <BookOpenText size={20} className="text-amber" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink">Class Content</p>
                <p className="text-xs text-ink-soft mt-0.5">All materials, by book and lesson</p>
              </div>
            </button>

            <button onClick={() => setTela('turmas')}
              className="w-full flex items-center gap-4 bg-surface border border-line rounded-2xl p-5 hover:border-teal/40 hover:shadow-card transition text-left">
              <div className="w-11 h-11 rounded-xl bg-teal-soft flex items-center justify-center shrink-0">
                <Users size={20} className="text-teal" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink">My Classes</p>
                <p className="text-xs text-ink-soft mt-0.5">Grade homework and check progress</p>
              </div>
            </button>

            <button onClick={() => setTela('correcoes')}
              className="w-full flex items-center gap-4 bg-surface border border-line rounded-2xl p-5 hover:border-teal/40 hover:shadow-card transition text-left">
              <div className="w-11 h-11 rounded-xl bg-teal-soft flex items-center justify-center shrink-0">
                <ClipboardCheck size={20} className="text-teal" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink">Recent Corrections</p>
                <p className="text-xs text-ink-soft mt-0.5">Quickly review what you've graded</p>
              </div>
            </button>

            <button onClick={() => setTela('config')}
              className="w-full flex items-center gap-4 bg-surface border border-line rounded-2xl p-5 hover:border-navy/40 hover:shadow-card transition text-left">
              <div className="w-11 h-11 rounded-xl bg-paper flex items-center justify-center shrink-0">
                <Settings size={20} className="text-navy" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink">Settings</p>
                <p className="text-xs text-ink-soft mt-0.5">Photo, theme and password</p>
              </div>
            </button>
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
