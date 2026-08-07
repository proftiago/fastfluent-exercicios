import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import logoNavy from '../assets/logo-navy.png'
import { TermosPrivacidade } from './TermosPrivacidade'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)
  const [mensagemRecuperar, setMensagemRecuperar] = useState(null)

  const [mostrarTermos, setMostrarTermos] = useState(null) // null | 'termos' | 'privacidade'

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!navigator.onLine) {
      setErro('Sem conexão com a internet. Verifica o Wi-Fi/dados e tenta de novo.')
      return
    }

    setCarregando(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      setCarregando(false)
      if (error) {
        const semRede = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('network')
        setErro(
          semRede
            ? 'Não foi possível conectar. Verifica sua internet e tenta de novo.'
            : 'Email ou senha incorretos. Se você é aluno novo e ainda não recebeu sua senha, fale com a secretaria.'
        )
      }
    } catch (e) {
      setCarregando(false)
      setErro('Não foi possível conectar. Verifica sua internet e tenta de novo.')
    }
  }

  async function enviarRecuperacao(e) {
    e.preventDefault()
    setMensagemRecuperar(null)
    setEnviandoRecuperar(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: window.location.origin,
    })
    setEnviandoRecuperar(false)
    if (error) {
      setMensagemRecuperar({ tipo: 'erro', texto: `Erro ao enviar: ${error.message}` })
      return
    }
    setMensagemRecuperar({ tipo: 'sucesso', texto: 'Se esse email existir na nossa base, você vai receber um link pra redefinir a senha em instantes.' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-120px] w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,160,54,0.20), transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,160,54,0.12), transparent 70%)' }} />

      <div className="w-full max-w-sm relative animar-entrada">
        <div className="flex flex-col items-center mb-8">
          <img src={logoNavy} alt="Fast Fluent" className="h-14 w-auto" />
        </div>

        {modoRecuperar ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-ink mb-1 text-center">Recuperar senha</h1>
            <p className="text-sm text-ink-soft mb-6 text-center">Manda seu email que a gente envia um link.</p>

            <form onSubmit={enviarRecuperacao} className="bg-surface rounded-2xl shadow-card border border-line p-7 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input type="email" required value={emailRecuperar} onChange={(e) => setEmailRecuperar(e.target.value)}
                    className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition" />
                </div>
              </div>
              {mensagemRecuperar && (
                <p className={`text-sm px-3 py-2 rounded-lg ${mensagemRecuperar.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-teal-soft text-teal'}`}>
                  {mensagemRecuperar.texto}
                </p>
              )}
              <button type="submit" disabled={enviandoRecuperar}
                className="pressionavel w-full bg-amber text-navy-deep text-sm font-semibold py-2.5 rounded-lg hover:bg-amber/90 disabled:opacity-50 transition">
                {enviandoRecuperar ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
              <button type="button" onClick={() => { setModoRecuperar(false); setMensagemRecuperar(null) }}
                className="w-full text-xs text-ink-soft hover:text-ink transition">
                Voltar pro login
              </button>
            </form>
          </>
        ) : (
          <>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-ink-soft uppercase tracking-wide">Senha</label>
                  <button type="button" onClick={() => setModoRecuperar(true)} className="text-[11px] text-navy hover:text-amber transition">
                    Esqueci minha senha
                  </button>
                </div>
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
          </>
        )}
      </div>

      <div className="relative mt-8 flex items-center gap-3 text-[11px] text-ink-faint">
        <button onClick={() => setMostrarTermos('termos')} className="hover:text-ink-soft transition">Termos de uso</button>
        <span>·</span>
        <button onClick={() => setMostrarTermos('privacidade')} className="hover:text-ink-soft transition">Privacidade</button>
      </div>

      {mostrarTermos && <TermosPrivacidade abaInicial={mostrarTermos} onFechar={() => setMostrarTermos(null)} />}
    </div>
  )
}
