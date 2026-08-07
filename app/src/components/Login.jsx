import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import logoNavy from '../assets/logo-navy.png'

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
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-120px] w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,160,54,0.20), transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,160,54,0.12), transparent 70%)' }} />

      <div className="w-full max-w-sm relative animar-entrada">
        <div className="flex flex-col items-center mb-8">
          <img src={logoNavy} alt="Fast Fluent" className="h-14 w-auto" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-ink mb-1 text-center">Continue sua jornada</h1>
        <p className="text-sm text-ink-soft mb-6 text-center">Entre para seguir rumo à fluência.</p>

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
            className="pressionavel w-full bg-amber text-navy-deep text-sm font-semibold py-2.5 rounded-lg hover:bg-amber/90 disabled:opacity-50 transition">
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
