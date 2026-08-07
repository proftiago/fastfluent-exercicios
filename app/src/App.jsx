import { useEffect, useState, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Login } from './components/Login'
import { RedefinirSenha } from './components/RedefinirSenha'
import { supabase } from './lib/supabaseClient'
import { ErroGeral } from './components/ErroGeral'
import { SemInternet } from './components/SemInternet'

const AreaAutoria = lazy(() => import('./components/AreaAutoria').then((m) => ({ default: m.AreaAutoria })))
const AreaAluno = lazy(() => import('./components/AreaAluno').then((m) => ({ default: m.AreaAluno })))
const AreaProfessor = lazy(() => import('./components/AreaProfessor').then((m) => ({ default: m.AreaProfessor })))

function CarregandoTela() {
  return <div className="min-h-screen flex items-center justify-center text-ink-soft text-sm">Carregando...</div>
}

function AppContent() {
  const { session, loading, recuperandoSenha } = useAuth()
  const [ehAutor, setEhAutor] = useState(null)
  const [ehProfessor, setEhProfessor] = useState(null)

  useEffect(() => {
    if (!session) {
      setEhAutor(null)
      setEhProfessor(null)
      return
    }
    supabase.from('autores').select('nome').eq('auth_user_id', session.user.id).maybeSingle()
      .then(({ data }) => setEhAutor(!!data))
    supabase.from('professor_contas').select('professor_id').eq('auth_user_id', session.user.id).maybeSingle()
      .then(({ data }) => setEhProfessor(!!data))
  }, [session])

  if (recuperandoSenha) return <RedefinirSenha />

  if (loading || (session && (ehAutor === null || ehProfessor === null))) {
    return <CarregandoTela />
  }

  if (!session) return <Login />

  return (
    <Suspense fallback={<CarregandoTela />}>
      {ehAutor ? <AreaAutoria /> : ehProfessor ? <AreaProfessor /> : <AreaAluno />}
    </Suspense>
  )
}

export default function App() {
  return (
    <ErroGeral>
      <ThemeProvider>
        <AuthProvider>
          <SemInternet />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErroGeral>
  )
}
