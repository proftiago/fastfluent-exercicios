import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { Login } from './components/Login'
import { AreaAutoria } from './components/AreaAutoria'
import { AreaAluno } from './components/AreaAluno'
import { AreaProfessor } from './components/AreaProfessor'
import { supabase } from './lib/supabaseClient'

function AppContent() {
  const { session, loading } = useAuth()
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

  if (loading || (session && (ehAutor === null || ehProfessor === null))) {
    return <div className="min-h-screen flex items-center justify-center text-ink-soft">Carregando...</div>
  }

  if (!session) return <Login />
  if (ehAutor) return <AreaAutoria />
  if (ehProfessor) return <AreaProfessor />
  return <AreaAluno />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
