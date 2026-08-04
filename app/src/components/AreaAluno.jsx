import { useEffect, useState } from 'react'
import { EstadoVazio } from './EstadoVazio'
import { UserX } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ListaExercicios } from './ListaExercicios'
import { LeitorMaterial } from './LeitorMaterial'
import { LivrosGrid } from './LivrosGrid'
import { LicoesGrid } from './LicoesGrid'
import { Configuracoes } from './Configuracoes'
import { LogOut, ChevronLeft, Settings, Camera, BookOpenText, ListChecks, Rocket, Sparkles, Flame, Star, User } from 'lucide-react'
import { Carregando } from './Carregando'

export function AreaAluno() {
  const { session, signOut } = useAuth()
  const [clienteId, setClienteId] = useState(null)
  const [nomeAluno, setNomeAluno] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [streak, setStreak] = useState(0)
  const [streakRecorde, setStreakRecorde] = useState(0)
  const [xp, setXp] = useState(0)
  const [livros, setLivros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [livroSel, setLivroSel] = useState(null)
  const [licaoSel, setLicaoSel] = useState(null)
  const [mostrarConfig, setMostrarConfig] = useState(false)
  const [abaLicao, setAbaLicao] = useState('conteudo')

  useEffect(() => {
    async function carregar() {
      const { data: conta } = await supabase
        .from('aluno_contas')
        .select('cliente_id, avatar_url, streak_atual, streak_recorde, xp_total, clientes(nome)')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (!conta?.cliente_id) { setCarregando(false); return }
      setClienteId(conta.cliente_id)
      setAvatarUrl(conta.avatar_url)
      setNomeAluno(conta.clientes?.nome || '')
      setStreak(conta.streak_atual || 0)
      setStreakRecorde(conta.streak_recorde || 0)
      setXp(conta.xp_total || 0)

      const { data: mats } = await supabase
        .from('matriculas')
        .select('id, turma_id, status, turmas(nome, idioma)')
        .eq('cliente_id', conta.cliente_id)
        .eq('status', 'ativa')

      const turmaIds = (mats || []).map((m) => m.turma_id).filter(Boolean)

      const { data: liberadas } = turmaIds.length
        ? await supabase.from('turma_licoes_liberadas').select('turma_id, nivel, licao').in('turma_id', turmaIds)
        : { data: [] }

      const gruposMapa = {}
      ;(liberadas || []).forEach((l) => {
        const chave = `${l.turma_id}-${l.nivel}`
        if (!gruposMapa[chave]) {
          const mat = (mats || []).find((m) => m.turma_id === l.turma_id)
          gruposMapa[chave] = {
            nivel: l.nivel,
            turmaId: l.turma_id,
            idioma: mat?.turmas?.idioma,
            licoes: [],
          }
        }
        gruposMapa[chave].licoes.push(l.licao)
      })

      setLivros(Object.values(gruposMapa))
      setCarregando(false)
    }
    carregar()
  }, [session])

  const livrosParaGrid = livros.map((l) => ({
    nivel: l.nivel,
    subtitulo: l.idioma,
    bloqueado: false,
    _livro: l,
  }))

  function selecionarLicao(numero) {
    setLicaoSel(numero)
    setAbaLicao('conteudo')
  }

  function irParaAprender() {
    setMostrarConfig(false)
  }

  function irParaPerfil() {
    setMostrarConfig(true)
    setLivroSel(null)
    setLicaoSel(null)
  }

  const licoes = livroSel
    ? Array.from({ length: 18 }, (_, i) => {
        const numero = i + 1
        const liberada = livroSel.licoes.includes(numero)
        const maisRecente = liberada && numero === Math.max(...livroSel.licoes)
        return { numero, atual: maisRecente, concluida: liberada && !maisRecente, bloqueada: !liberada }
      })
    : []

  const primeiroNome = nomeAluno.split(' ')[0]
  const totalLicoes = livros.reduce((soma, l) => soma + l.licoes.length, 0)
  const naTelaInicial = !livroSel && !licaoSel && !mostrarConfig

  return (
    <div className="min-h-screen bg-paper pb-20">
      <header className="bg-navy">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center gap-2">
          <button onClick={irParaAprender} className="flex items-center gap-2 text-left shrink-0">
            <div className="w-7 h-7 rounded-lg bg-amber flex items-center justify-center font-display font-bold text-navy-deep text-xs shrink-0">FF</div>
            <p className="font-mono text-amber text-[10px] tracking-[0.2em] uppercase hidden sm:block">Fast Fluent</p>
          </button>

          {clienteId && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
                <Flame size={13} className="text-amber" />
                <span className="text-xs font-bold text-white">{streak}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
                <Star size={13} className="text-amber" />
                <span className="text-xs font-bold text-white">{xp}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={signOut} className="text-white/70 hover:text-white transition p-1.5">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {mostrarConfig ? (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-surface border border-line rounded-2xl p-3 text-center">
                <Flame size={18} className="text-amber mx-auto mb-1" />
                <p className="text-lg font-bold text-ink">{streak}</p>
                <p className="text-[10px] text-ink-soft">sequência</p>
              </div>
              <div className="bg-surface border border-line rounded-2xl p-3 text-center">
                <Star size={18} className="text-amber mx-auto mb-1" />
                <p className="text-lg font-bold text-ink">{xp}</p>
                <p className="text-[10px] text-ink-soft">XP total</p>
              </div>
              <div className="bg-surface border border-line rounded-2xl p-3 text-center">
                <Rocket size={18} className="text-teal mx-auto mb-1" />
                <p className="text-lg font-bold text-ink">{streakRecorde}</p>
                <p className="text-[10px] text-ink-soft">recorde</p>
              </div>
            </div>
            <Configuracoes avatarUrl={avatarUrl} onAvatarAtualizado={setAvatarUrl} />
          </div>
        ) : (
          <>
            {carregando && <Carregando />}

            {!carregando && !clienteId && (
              <EstadoVazio icone={UserX} titulo="Conta não vinculada" descricao="Fale com a secretaria pra vincular seu cadastro de aluno." />
            )}

            {!carregando && clienteId && naTelaInicial && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-deep p-6 mb-6 shadow-card-amber animar-entrada">
                <Sparkles size={16} className="absolute top-5 right-6 text-amber/40" />
                <Sparkles size={10} className="absolute top-14 right-16 text-white/20" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0 border-2 border-amber/40">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={18} className="text-white/50" />}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-white leading-tight">
                      {primeiroNome ? `Olá, ${primeiroNome}!` : 'Bem-vindo(a)!'}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">Continue sua jornada.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-white/[0.06] rounded-2xl px-4 py-3">
                    <Rocket size={18} className="text-amber shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{totalLicoes}</p>
                      <p className="text-[11px] text-white/50">{totalLicoes === 1 ? 'lição' : 'lições'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.06] rounded-2xl px-4 py-3">
                    <Flame size={18} className="text-amber shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{streak} {streak === 1 ? 'dia' : 'dias'}</p>
                      <p className="text-[11px] text-white/50">de sequência</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!carregando && clienteId && livros.length === 0 && (
              <EstadoVazio titulo="Nenhuma lição por aqui ainda" descricao="Assim que sua turma avançar, as lições aparecem aqui." />
            )}

            {!carregando && livros.length >= 1 && !livroSel && (
              <div className="animar-entrada">
                <h2 className="font-display text-lg font-semibold text-ink mb-1">Seus livros</h2>
                <p className="text-sm text-ink-soft mb-4">Escolha o livro.</p>
                <LivrosGrid livros={livrosParaGrid} onSelecionar={(l) => setLivroSel(l._livro)} />
              </div>
            )}

            {!carregando && livroSel && !licaoSel && (
              <div className="animar-entrada">
                {livros.length >= 1 && (
                  <button onClick={() => setLivroSel(null)} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-3 transition">
                    <ChevronLeft size={16} /> Livros
                  </button>
                )}
                <h2 className="font-display text-lg font-semibold text-ink mb-1">{livroSel.nivel}</h2>
                <p className="text-sm text-ink-soft mb-4">
                  {livroSel.licoes.length} {livroSel.licoes.length === 1 ? 'lição liberada.' : 'lições liberadas.'}
                </p>
                <LicoesGrid licoes={licoes} onSelecionar={selecionarLicao} />
              </div>
            )}

            {!carregando && livroSel && licaoSel && (
              <div className="animar-entrada">
                <button onClick={() => setLicaoSel(null)} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4 transition">
                  <ChevronLeft size={16} /> {livroSel.nivel} — Lições
                </button>

                <div className="inline-flex bg-paper border border-line rounded-full p-1 mb-5">
                  <button
                    onClick={() => setAbaLicao('conteudo')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                      abaLicao === 'conteudo' ? 'bg-navy text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                    }`}>
                    <BookOpenText size={15} /> Conteúdo
                  </button>
                  <button
                    onClick={() => setAbaLicao('exercicios')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                      abaLicao === 'exercicios' ? 'bg-navy text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                    }`}>
                    <ListChecks size={15} /> Exercícios
                  </button>
                </div>

                {abaLicao === 'conteudo'
                  ? <LeitorMaterial nivel={livroSel.nivel} licao={licaoSel} />
                  : <ListaExercicios clienteId={clienteId} nivel={livroSel.nivel} licao={licaoSel} />}
              </div>
            )}
          </>
        )}
      </main>

      {clienteId && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-30">
          <div className="max-w-2xl mx-auto grid grid-cols-2">
            <button onClick={irParaAprender}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition ${!mostrarConfig ? 'text-amber' : 'text-ink-faint'}`}>
              <BookOpenText size={20} />
              <span className="text-[10px] font-medium">Aprender</span>
            </button>
            <button onClick={irParaPerfil}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition ${mostrarConfig ? 'text-amber' : 'text-ink-faint'}`}>
              <User size={20} />
              <span className="text-[10px] font-medium">Perfil</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
