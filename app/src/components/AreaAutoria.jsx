import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CriarExercicio } from './CriarExercicio'
import { MeusExercicios } from './MeusExercicios'
import { ProgressoTurmas } from './ProgressoTurmas'
import { LivrosGrid, NIVEIS } from './LivrosGrid'
import { LicoesGrid } from './LicoesGrid'
import { EditarMaterial } from './EditarMaterial'
import { EditarLicoesLista } from './EditarLicoesLista'
import { Carregando } from './Carregando'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Rocket, LogOut, ChevronLeft, FileEdit } from 'lucide-react'

export function AreaAutoria() {
  const { signOut } = useAuth()
  const [turmas, setTurmas] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [aba, setAba] = useState('criar')

  const [nivelSel, setNivelSel] = useState(null)
  const [licaoSel, setLicaoSel] = useState(null)
  const [contagemPorLicao, setContagemPorLicao] = useState({})
  const [carregandoContagem, setCarregandoContagem] = useState(false)
  const [exercicioEditando, setExercicioEditando] = useState(null)

  useEffect(() => {
    supabase.from('turmas').select('id, nome, nivel').then(({ data }) => { if (data) setTurmas(data) })
  }, [])

  const carregarContagem = useCallback(async (nivel) => {
    setCarregandoContagem(true)
    const { data } = await supabase.from('exercicios').select('licao').eq('nivel', nivel)
    const cont = {}
    ;(data || []).forEach((e) => { cont[e.licao] = (cont[e.licao] || 0) + 1 })
    setContagemPorLicao(cont)
    setCarregandoContagem(false)
  }, [])

  useEffect(() => {
    if (nivelSel) carregarContagem(nivelSel)
  }, [nivelSel, refreshKey, carregarContagem])

  const livros = NIVEIS.map((nivel) => ({ nivel, bloqueado: false }))
  const licoes = Array.from({ length: 18 }, (_, i) => ({
    numero: i + 1,
    bloqueada: false,
    contagem: contagemPorLicao[i + 1] || 0,
  }))

  function voltarParaLivros() { setNivelSel(null); setLicaoSel(null); setExercicioEditando(null) }
  function voltarParaLicoes() { setLicaoSel(null); setExercicioEditando(null) }

  function irEditarLicao(nivel, licao) {
    setNivelSel(nivel)
    setLicaoSel(licao)
    setAba('criar')
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <aside className="md:w-60 shrink-0 bg-navy flex md:flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="px-5 py-6 flex md:flex-col items-center md:items-start gap-3 md:gap-1 flex-1 md:flex-none">
          <div className="w-9 h-9 rounded-lg bg-amber flex items-center justify-center font-display font-bold text-navy-deep text-sm">FF</div>
          <div>
            <p className="font-mono text-amber text-[10px] tracking-[0.2em] uppercase leading-none">Fast Fluent</p>
            <p className="font-display text-white text-sm font-semibold mt-0.5">Exercícios</p>
          </div>
        </div>

        <nav className="flex md:flex-col gap-0.5 px-3 md:px-3 md:mt-3 md:flex-1">
          <button
            onClick={() => { setAba('criar'); voltarParaLivros() }}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              aba === 'criar' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {aba === 'criar' && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-amber rounded-full" />}
            <BookOpen size={17} strokeWidth={2} />
            <span className="hidden md:inline">Exercícios</span>
          </button>
          <button
            onClick={() => setAba('editar-licoes')}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              aba === 'editar-licoes' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {aba === 'editar-licoes' && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-amber rounded-full" />}
            <FileEdit size={17} strokeWidth={2} />
            <span className="hidden md:inline">Editar lições</span>
          </button>
          <button
            onClick={() => setAba('progresso')}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              aba === 'progresso' ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {aba === 'progresso' && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-amber rounded-full" />}
            <Rocket size={17} strokeWidth={2} />
            <span className="hidden md:inline">Progresso</span>
          </button>
        </nav>

        <div className="px-3 pb-4 hidden md:block">
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition">
            <LogOut size={17} strokeWidth={2} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 px-6 md:px-10 py-8 md:py-10 max-w-4xl mx-auto w-full">
        {aba === 'criar' && !nivelSel && (
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink tracking-tight">Livros</h1>
            <p className="text-ink-soft text-sm mt-1">Escolha um nível pra ver as lições.</p>
          </div>
        )}
        {aba === 'criar' && nivelSel && !licaoSel && (
          <div className="mb-8">
            <button onClick={voltarParaLivros} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-3 transition">
              <ChevronLeft size={16} /> Livros
            </button>
            <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink tracking-tight">{nivelSel}</h1>
            <p className="text-ink-soft text-sm mt-1">Escolha a lição pra ver ou criar exercícios.</p>
          </div>
        )}
        {aba === 'criar' && nivelSel && licaoSel && (
          <div className="mb-8">
            <button onClick={voltarParaLicoes} className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-3 transition">
              <ChevronLeft size={16} /> {nivelSel} — Lições
            </button>
            <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink tracking-tight">
              {nivelSel} · Lição {String(licaoSel).padStart(2, '0')}
            </h1>
          </div>
        )}
        {aba === 'editar-licoes' && (
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink tracking-tight">Editar lições</h1>
            <p className="text-ink-soft text-sm mt-1">Lições que já têm material criado — clique pra editar direto.</p>
          </div>
        )}
        {aba === 'progresso' && (
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink tracking-tight">Progresso das turmas</h1>
            <p className="text-ink-soft text-sm mt-1">Consulta do que já foi liberado — o controle de verdade agora é feito pela Chamada no Gestão.</p>
          </div>
        )}

        {aba === 'criar' && !nivelSel && (
          <LivrosGrid livros={livros} onSelecionar={(l) => setNivelSel(l.nivel)} />
        )}

        {aba === 'criar' && nivelSel && !licaoSel && (
          carregandoContagem
            ? <Carregando />
            : <LicoesGrid licoes={licoes} onSelecionar={setLicaoSel} />
        )}

        {aba === 'criar' && nivelSel && licaoSel && (
          <div className="space-y-8">
            <EditarMaterial nivel={nivelSel} licao={licaoSel} />
            <CriarExercicio
              turmas={turmas}
              nivelFixo={nivelSel}
              licaoFixa={licaoSel}
              exercicioEditando={exercicioEditando}
              onCancelarEdicao={() => setExercicioEditando(null)}
              onCriado={() => { setRefreshKey((k) => k + 1); setExercicioEditando(null) }}
            />
            <MeusExercicios
              refreshKey={refreshKey}
              nivelFiltro={nivelSel}
              licaoFiltro={licaoSel}
              onExcluido={() => setRefreshKey((k) => k + 1)}
              onEditar={setExercicioEditando}
            />
          </div>
        )}

        {aba === 'editar-licoes' && <EditarLicoesLista onSelecionar={irEditarLicao} />}

        {aba === 'progresso' && <ProgressoTurmas />}
      </main>
    </div>
  )
}
