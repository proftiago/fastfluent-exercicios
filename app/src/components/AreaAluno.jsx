import { useEffect, useState } from 'react'
import { EstadoVazio } from './EstadoVazio'
import { UserX } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ListaExercicios } from './ListaExercicios'
import { LivrosGrid } from './LivrosGrid'
import { BlocosLicoes } from './BlocosLicoes'
import { LicoesGrid } from './LicoesGrid'
import { MenuSecoesLicaoAluno } from './MenuSecoesLicaoAluno'
import { NavTopo } from './NavTopo'
import { Configuracoes } from './Configuracoes'
import { HistoricoAluno } from './HistoricoAluno'
import { Comemoracao } from './Comemoracao'
import { LogOut, Settings, Camera, BookOpenText, ListChecks, Rocket, Sparkles, Flame, Star, User, CalendarCheck, PlayCircle } from 'lucide-react'
import { Carregando } from './Carregando'
import logoBranco from '../assets/logo-branco.png'

// Todas as 18 lições de um livro ficam liberadas de uma vez (o aluno pode navegar o
// livro inteiro), mas "atual"/"onde parei" precisa usar a lição REAL sendo dada
// pelo professor (turma_progresso.licao_atual), não a última liberada.
function montarLicoes(livro) {
  return Array.from({ length: 18 }, (_, i) => {
    const numero = i + 1
    const liberada = livro.licoes.includes(numero)
    const atual = liberada && numero === livro.licaoAtual
    return { numero, atual, concluida: liberada && numero < livro.licaoAtual, bloqueada: !liberada }
  })
}

export function AreaAluno() {
  const { session, signOut } = useAuth()
  const [clienteId, setClienteId] = useState(null)
  const [nomeAluno, setNomeAluno] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [streak, setStreak] = useState(0)
  const [streakRecorde, setStreakRecorde] = useState(0)
  const [streakEmRisco, setStreakEmRisco] = useState(false)
  const [xp, setXp] = useState(0)
  const [livros, setLivros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [telaAtiva, setTelaAtiva] = useState('aprender')
  const [comemoracaoLivro, setComemoracaoLivro] = useState(null)

  const [livroSel, setLivroSel] = useState(null)
  const [blocoSel, setBlocoSel] = useState(null)
  const [licaoSel, setLicaoSel] = useState(null)
  const [abaLicao, setAbaLicao] = useState('conteudo')
  const [secaoSel, setSecaoSel] = useState(null)

  useEffect(() => {
    async function carregar() {
      const { data: conta } = await supabase
        .from('aluno_contas')
        .select('cliente_id, avatar_url, streak_atual, streak_recorde, xp_total, ultima_atividade, clientes(nome)')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (!conta?.cliente_id) { setCarregando(false); return }
      setClienteId(conta.cliente_id)
      setAvatarUrl(conta.avatar_url)
      setNomeAluno(conta.clientes?.nome || '')
      setStreak(conta.streak_atual || 0)
      setStreakRecorde(conta.streak_recorde || 0)
      setXp(conta.xp_total || 0)

      if (conta.streak_atual > 0 && conta.ultima_atividade) {
        const ontem = new Date()
        ontem.setDate(ontem.getDate() - 1)
        const ontemStr = ontem.toISOString().slice(0, 10)
        setStreakEmRisco(conta.ultima_atividade === ontemStr)
      }

      const { data: mats } = await supabase
        .from('matriculas')
        .select('id, turma_id, status, turmas(nome, idioma)')
        .eq('cliente_id', conta.cliente_id)
        .eq('status', 'ativa')

      const turmaIds = (mats || []).map((m) => m.turma_id).filter(Boolean)

      const { data: liberadas } = turmaIds.length
        ? await supabase.from('turma_licoes_liberadas').select('turma_id, nivel, licao').in('turma_id', turmaIds)
        : { data: [] }

      // Lição REAL que está sendo dada agora em cada turma (não confundir com
      // "liberada pra navegar", que já vem todas de uma vez)
      const { data: progresso } = turmaIds.length
        ? await supabase.from('turma_progresso').select('turma_id, licao_atual').in('turma_id', turmaIds)
        : { data: [] }
      const licaoAtualPorTurma = Object.fromEntries((progresso || []).map((p) => [p.turma_id, p.licao_atual]))

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
            licaoAtual: licaoAtualPorTurma[l.turma_id] || 1,
          }
        }
        gruposMapa[chave].licoes.push(l.licao)
      })

      const listaLivros = Object.values(gruposMapa)
      setLivros(listaLivros)
      setCarregando(false)

      // Comemoração de livro completo — baseado na Lição 18 ter sido DADA de
      // verdade (existe aula registrada), não só "liberada pra ver" no app
      for (const livro of listaLivros) {
        if (livro.licaoAtual < 18) continue
        const { count } = await supabase
          .from('aulas')
          .select('id', { count: 'exact', head: true })
          .eq('turma_id', livro.turmaId)
          .eq('nivel', livro.nivel)
          .eq('licao', 18)
        if (count > 0) {
          const chaveFlag = `ff_livro_completo_${conta.cliente_id}_${livro.nivel}`
          if (!localStorage.getItem(chaveFlag)) {
            localStorage.setItem(chaveFlag, '1')
            setComemoracaoLivro(livro.nivel)
          }
          break
        }
      }
    }
    carregar()
  }, [session])

  const livrosParaGrid = livros.map((l) => ({
    nivel: l.nivel,
    subtitulo: l.idioma,
    bloqueado: false,
    progresso: Math.round((l.licaoAtual / 18) * 100),
    _livro: l,
  }))

  const livroEmAndamento = livros.find((l) => l.licaoAtual > 0 && l.licaoAtual < 18) || livros[0]

  function continuarDeOndeParei() {
    if (!livroEmAndamento) return
    const numeroAtual = livroEmAndamento.licaoAtual
    const indiceBloco = Math.floor((numeroAtual - 1) / 3)
    const inicio = indiceBloco * 3
    const licoesDoLivro = montarLicoes(livroEmAndamento)
    setLivroSel(livroEmAndamento)
    setBlocoSel({ numero: indiceBloco + 1, inicio: inicio + 1, fim: inicio + 3, trio: licoesDoLivro.slice(inicio, inicio + 3) })
    setLicaoSel(numeroAtual)
    setAbaLicao('conteudo')
    setSecaoSel(null)
  }

  function irParaAprender() {
    setTelaAtiva('aprender')
  }

  function irParaHistorico() {
    setTelaAtiva('historico')
    resetarNavegacao()
  }

  function irParaPerfil() {
    setTelaAtiva('perfil')
    resetarNavegacao()
  }

  function resetarNavegacao() {
    setLivroSel(null); setBlocoSel(null); setLicaoSel(null); setAbaLicao('conteudo'); setSecaoSel(null)
  }

  function irParaHome() {
    setTelaAtiva('aprender')
    resetarNavegacao()
  }

  function voltarUmNivel() {
    if (secaoSel) { setSecaoSel(null); return }
    if (licaoSel) { setLicaoSel(null); setAbaLicao('conteudo'); return }
    if (blocoSel) { setBlocoSel(null); return }
    if (livroSel) { setLivroSel(null); return }
  }

  function selecionarLicao(numero) {
    setLicaoSel(numero)
    setAbaLicao('conteudo')
    setSecaoSel(null)
  }

  const licoes = livroSel ? montarLicoes(livroSel) : []

  const primeiroNome = nomeAluno.split(' ')[0]
  const totalLicoes = livros.reduce((soma, l) => soma + l.licoes.length, 0)
  const naTelaInicial = !livroSel && telaAtiva === 'aprender'

  const tituloTopo = licaoSel
    ? `${livroSel?.nivel} · Lesson ${String(licaoSel).padStart(2, '0')}`
    : blocoSel
    ? `${livroSel?.nivel} · ${String(blocoSel.inicio).padStart(2, '0')}–${String(blocoSel.fim).padStart(2, '0')}`
    : livroSel?.nivel

  return (
    <div className="min-h-screen bg-paper pb-20">
      <header className="bg-navy">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center gap-2">
          <button onClick={irParaHome} className="flex items-center shrink-0">
            <img src={logoBranco} alt="Fast Fluent" className="h-6 w-auto" />
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
        {telaAtiva === 'perfil' ? (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-surface border border-line rounded-2xl p-3 text-center">
                <Flame size={18} className="text-amber mx-auto mb-1" />
                <p className="text-lg font-bold text-ink">{streak}</p>
                <p className="text-[10px] text-ink-soft">streak</p>
              </div>
              <div className="bg-surface border border-line rounded-2xl p-3 text-center">
                <Star size={18} className="text-amber mx-auto mb-1" />
                <p className="text-lg font-bold text-ink">{xp}</p>
                <p className="text-[10px] text-ink-soft">total XP</p>
              </div>
              <div className="bg-surface border border-line rounded-2xl p-3 text-center">
                <Rocket size={18} className="text-teal mx-auto mb-1" />
                <p className="text-lg font-bold text-ink">{streakRecorde}</p>
                <p className="text-[10px] text-ink-soft">best streak</p>
              </div>
            </div>
            <Configuracoes avatarUrl={avatarUrl} onAvatarAtualizado={setAvatarUrl} />
          </div>
        ) : telaAtiva === 'historico' ? (
          <div>
            {carregando && <Carregando />}
            {!carregando && clienteId && <HistoricoAluno clienteId={clienteId} nomeAluno={nomeAluno} />}
          </div>
        ) : (
          <>
            {carregando && <Carregando />}

            {!carregando && !clienteId && (
              <EstadoVazio icone={UserX} titulo="Account not linked" descricao="Please contact the office to link your student account." />
            )}

            {!carregando && clienteId && naTelaInicial && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-deep p-6 mb-4 shadow-card-amber animar-entrada">
                <Sparkles size={16} className="absolute top-5 right-6 text-amber/40" />
                <Sparkles size={10} className="absolute top-14 right-16 text-white/20" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0 border-2 border-amber/40">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={18} className="text-white/50" />}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-white leading-tight">
                      {primeiroNome ? `Hi, ${primeiroNome}!` : 'Welcome!'}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">Keep your journey going.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-white/[0.06] rounded-2xl px-4 py-3">
                    <Rocket size={18} className="text-amber shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{totalLicoes}</p>
                      <p className="text-[11px] text-white/50">{totalLicoes === 1 ? 'lesson' : 'lessons'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.06] rounded-2xl px-4 py-3">
                    <Flame size={18} className="text-amber shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{streak} {streak === 1 ? 'day' : 'days'}</p>
                      <p className="text-[11px] text-white/50">streak</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!carregando && clienteId && naTelaInicial && streakEmRisco && (
              <div className="animar-entrada flex items-center gap-3 bg-amber-soft border border-amber/30 rounded-2xl px-4 py-3 mb-4">
                <Flame size={20} className="text-amber shrink-0" />
                <p className="text-xs text-amber flex-1">
                  Your <strong>{streak}-day streak</strong> is about to end! Do an exercise today to keep it going.
                </p>
              </div>
            )}

            {!carregando && clienteId && naTelaInicial && livroEmAndamento && livroEmAndamento.licaoAtual > 0 && (
              <button onClick={continuarDeOndeParei}
                className="pressionavel w-full flex items-center gap-3 bg-surface border border-line rounded-2xl px-4 py-3.5 mb-6 hover:border-amber/40 hover:shadow-card transition text-left animar-entrada">
                <div className="w-10 h-10 rounded-xl bg-amber-soft flex items-center justify-center shrink-0">
                  <PlayCircle size={19} className="text-amber" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Continue where you left off</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {livroEmAndamento.nivel} · Lesson {String(livroEmAndamento.licaoAtual).padStart(2, '0')}
                  </p>
                </div>
              </button>
            )}

            {!carregando && clienteId && naTelaInicial && (
              livros.length === 0
                ? <EstadoVazio titulo="No lessons here yet" descricao="As soon as your class moves forward, lessons will show up here." />
                : (
                  <div className="animar-entrada">
                    <h2 className="font-display text-lg font-semibold text-ink mb-1">Your books</h2>
                    <p className="text-sm text-ink-soft mb-4">Choose a book.</p>
                    <LivrosGrid livros={livrosParaGrid} onSelecionar={(l) => setLivroSel(l._livro)} />
                  </div>
                )
            )}

            {livroSel && (
              <div>
                <NavTopo onVoltar={voltarUmNivel} onHome={irParaHome} titulo={tituloTopo} />

                {!blocoSel && (
                  <BlocosLicoes licoes={licoes} onSelecionarBloco={setBlocoSel} />
                )}

                {blocoSel && !licaoSel && (
                  <LicoesGrid licoes={blocoSel.trio} onSelecionar={selecionarLicao} />
                )}

                {licaoSel && (
                  <div>
                    <div className="inline-flex bg-paper border border-line rounded-full p-1 mb-5">
                      <button
                        onClick={() => { setAbaLicao('conteudo'); setSecaoSel(null) }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                          abaLicao === 'conteudo' ? 'bg-navy text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                        }`}>
                        <BookOpenText size={15} /> Content
                      </button>
                      <button
                        onClick={() => setAbaLicao('exercicios')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                          abaLicao === 'exercicios' ? 'bg-navy text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                        }`}>
                        <ListChecks size={15} /> Exercises
                      </button>
                    </div>

                    {abaLicao === 'conteudo'
                      ? <MenuSecoesLicaoAluno nivel={livroSel.nivel} licao={licaoSel} secaoSel={secaoSel} onSelecionarSecao={setSecaoSel} />
                      : <ListaExercicios clienteId={clienteId} nivel={livroSel.nivel} licao={licaoSel} />}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {clienteId && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-30 print:hidden">
          <div className="max-w-2xl mx-auto grid grid-cols-3">
            <button onClick={irParaAprender}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition ${telaAtiva === 'aprender' ? 'text-amber' : 'text-ink-faint'}`}>
              <BookOpenText size={20} />
              <span className="text-[10px] font-medium">Learn</span>
            </button>
            <button onClick={irParaHistorico}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition ${telaAtiva === 'historico' ? 'text-amber' : 'text-ink-faint'}`}>
              <CalendarCheck size={20} />
              <span className="text-[10px] font-medium">History</span>
            </button>
            <button onClick={irParaPerfil}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition ${telaAtiva === 'perfil' ? 'text-amber' : 'text-ink-faint'}`}>
              <User size={20} />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </nav>
      )}

      {comemoracaoLivro && (
        <Comemoracao
          titulo={`Book complete! 🎉`}
          descricao={`You finished all 18 lessons of ${comemoracaoLivro}! On to the next adventure.`}
          onFechar={() => setComemoracaoLivro(null)}
        />
      )}
    </div>
  )
}
