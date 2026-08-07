import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Lock, Rocket } from 'lucide-react'

export function RedefinirSenha() {
  const { finalizarRecuperacao } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErro('')

    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setSalvando(false)

    if (error) {
      setErro(`Erro ao salvar: ${error.message}`)
      return
    }
    setSucesso(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm animar-entrada">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-soft flex items-center justify-center mb-3">
            <Rocket size={24} className="text-amber -rotate-45" />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink text-center">Nova senha</h1>
          <p className="text-sm text-ink-soft text-center mt-1">Escolha uma senha nova pra sua conta.</p>
        </div>

        {sucesso ? (
          <div className="bg-surface rounded-2xl shadow-card border border-line p-7 text-center space-y-4">
            <p className="text-sm text-teal bg-teal-soft rounded-lg px-3 py-2">Senha alterada com sucesso!</p>
            <button onClick={finalizarRecuperacao}
              className="pressionavel w-full bg-navy text-white text-sm font-medium py-2.5 rounded-lg hover:bg-navy-deep transition">
              Continuar
            </button>
          </div>
        ) : (
          <form onSubmit={salvar} className="bg-surface rounded-2xl shadow-card border border-line p-7 space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Nova senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="password" required value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Confirmar nova senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="password" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition" />
              </div>
            </div>
            {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
            <button type="submit" disabled={salvando}
              className="pressionavel w-full bg-amber text-navy-deep text-sm font-semibold py-2.5 rounded-lg hover:bg-amber/90 disabled:opacity-50 transition">
              {salvando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
