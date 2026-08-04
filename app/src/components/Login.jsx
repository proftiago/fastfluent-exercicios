import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Rocket, Eye, EyeOff, Mail, Lock } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) setErro('Email ou senha incorretos. Se você é aluno novo e ainda não recebeu sua senha, fale com a secretaria.')
  }

  return (
    <div className="min-h-screen flex bg-navy-deep">
      <div className="hidden md:flex md:w-[42%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-navy to-navy-deep">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-72 orbita-lenta">
            <div className="absolute inset-0 rounded-full border border-amber/20" />
            <div className="absolute inset-6 rounded-full border border-white/10" />
            <div className="absolute inset-14 rounded-full border border-amber/10" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_16px_4px_rgba(239,160,54,0.5)]" />
          </div>
          <Rocket size={30} className="absolute text-amber/70 -rotate-45" style={{ top: '28%', right: '22%' }} />
        </div>
        {[...Array(14)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white pointer-events-none"
            style={{
              width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
              top: `${(i * 37) % 90}%`, left: `${(i * 53) % 95}%`,
              opacity: 0.15 + (i % 4) * 0.1,
            }} />
        ))}

        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center font-display font-bold text-navy-deep text-sm mb-4">FF</div>
          <p className="font-mono text-amber text-[11px] tracking-[0.25em] uppercase">Fast Fluent Idiomas</p>
        </div>
        <div className="relative">
          <p className="font-display text-3xl font-semibold text-white leading-tight">
            Sua prática,<br />sua trajetória.
          </p>
          <p className="text-white/50 text-sm mt-3 max-w-xs">
            Exercícios liberados conforme sua turma avança, do Spark ao Beyond.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 bg-paper">
        <div className="w-full max-w-sm animar-entrada">
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-navy flex items-center justify-center font-display font-bold text-amber text-lg mb-3">FF</div>
            <p className="font-mono text-navy text-[11px] tracking-[0.25em] uppercase">Fast Fluent</p>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">Entrar</h1>
          <p className="text-sm text-ink-soft mb-6">Acesse seus exercícios.</p>
          <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-card border border-line p-7 space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type={mostrarSenha ? 'text' : 'password'} required value={senha} onChange={(e) => setSenha(e.target.value)}
                  className="w-full border border-line rounded-lg pl-9 pr-9 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition"
                />
                <button type="button" onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft transition">
                  {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 animar-entrada">{erro}</p>}
            <button type="submit" disabled={carregando}
              className="pressionavel w-full bg-navy text-white text-sm font-medium py-2.5 rounded-lg hover:bg-navy-deep disabled:opacity-50 transition">
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
