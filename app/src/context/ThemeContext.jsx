import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('ff_tema') || 'claro')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    localStorage.setItem('ff_tema', tema)
  }, [tema])

  function alternar() {
    setTema((t) => (t === 'claro' ? 'escuro' : 'claro'))
  }

  return (
    <ThemeContext.Provider value={{ tema, setTema, alternar }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>')
  return ctx
}
