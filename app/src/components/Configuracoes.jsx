import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Camera, Loader2 } from 'lucide-react'

export function Configuracoes({ avatarUrl, onAvatarAtualizado, tabela = 'aluno_contas' }) {
  const { session } = useAuth()
  const { tema, alternar } = useTheme()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [mensagemSenha, setMensagemSenha] = useState(null)

  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [mensagemFoto, setMensagemFoto] = useState(null)

  async function trocarSenha(e) {
    e.preventDefault()
    setMensagemSenha(null)

    if (novaSenha.length < 6) {
      setMensagemSenha({ tipo: 'erro', texto: 'A nova senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    if (novaSenha !== confirmarSenha) {
      setMensagemSenha({ tipo: 'erro', texto: 'As senhas não coincidem.' })
      return
    }

    setSalvandoSenha(true)

    const { error: erroVerificacao } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: senhaAtual,
    })

    if (erroVerificacao) {
      setSalvandoSenha(false)
      setMensagemSenha({ tipo: 'erro', texto: 'Senha atual incorreta.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setSalvandoSenha(false)

    if (error) {
      setMensagemSenha({ tipo: 'erro', texto: `Erro ao trocar senha: ${error.message}` })
      return
    }

    setMensagemSenha({ tipo: 'sucesso', texto: 'Senha alterada com sucesso.' })
    setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('')
  }

  async function enviarFoto(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (!arquivo.type.startsWith('image/')) {
      setMensagemFoto({ tipo: 'erro', texto: 'Escolha um arquivo de imagem.' })
      return
    }
    if (arquivo.size > 3 * 1024 * 1024) {
      setMensagemFoto({ tipo: 'erro', texto: 'Imagem muito grande (máx 3MB).' })
      return
    }

    setEnviandoFoto(true)
    setMensagemFoto(null)

    const extensao = arquivo.name.split('.').pop()
    const caminho = `${session.user.id}/avatar.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from('avatars')
      .upload(caminho, arquivo, { upsert: true })

    if (erroUpload) {
      setEnviandoFoto(false)
      setMensagemFoto({ tipo: 'erro', texto: `Erro ao enviar: ${erroUpload.message}` })
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(caminho)
    const urlComVersao = `${urlData.publicUrl}?v=${Date.now()}`

    const { error: erroSalvar } = await supabase
      .from(tabela)
      .update({ avatar_url: urlComVersao })
      .eq('auth_user_id', session.user.id)

    setEnviandoFoto(false)

    if (erroSalvar) {
      setMensagemFoto({ tipo: 'erro', texto: `Erro ao salvar: ${erroSalvar.message}` })
      return
    }

    setMensagemFoto({ tipo: 'sucesso', texto: 'Foto atualizada.' })
    onAvatarAtualizado?.(urlComVersao)
  }

  return (
    <div className="space-y-6 max-w-md">
      <div className="bg-surface rounded-2xl border border-line p-6">
        <h2 className="font-display text-base font-semibold text-ink mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-paper border border-line overflow-hidden flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Sua foto" className="w-full h-full object-cover" />
            ) : (
              <Camera size={20} className="text-ink-faint" />
            )}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-navy bg-paper hover:bg-line px-3.5 py-2 rounded-lg transition">
              {enviandoFoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {enviandoFoto ? 'Enviando...' : 'Escolher foto'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={enviarFoto} disabled={enviandoFoto} />
          </label>
        </div>
        {mensagemFoto && (
          <p className={`text-sm mt-3 px-3 py-2 rounded-lg ${mensagemFoto.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-teal-soft text-teal'}`}>
            {mensagemFoto.texto}
          </p>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-line p-6">
        <h2 className="font-display text-base font-semibold text-ink mb-4">Aparência</h2>
        <div className="flex gap-2">
          <button
            onClick={() => tema !== 'claro' && alternar()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition ${
              tema === 'claro' ? 'border-navy bg-navy text-white' : 'border-line text-ink-soft hover:border-navy/30'
            }`}
          >
            <Sun size={15} /> Claro
          </button>
          <button
            onClick={() => tema !== 'escuro' && alternar()}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition ${
              tema === 'escuro' ? 'border-navy bg-navy text-white' : 'border-line text-ink-soft hover:border-navy/30'
            }`}
          >
            <Moon size={15} /> Escuro
          </button>
        </div>
      </div>

      <form onSubmit={trocarSenha} className="bg-surface rounded-2xl border border-line p-6 space-y-3">
        <h2 className="font-display text-base font-semibold text-ink mb-1">Trocar senha</h2>
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wide">Senha atual</label>
          <input type="password" required value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wide">Nova senha</label>
          <input type="password" required value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1 uppercase tracking-wide">Confirmar nova senha</label>
          <input type="password" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber" />
        </div>
        {mensagemSenha && (
          <p className={`text-sm px-3 py-2 rounded-lg ${mensagemSenha.tipo === 'erro' ? 'bg-red-50 text-red-600' : 'bg-teal-soft text-teal'}`}>
            {mensagemSenha.texto}
          </p>
        )}
        <button type="submit" disabled={salvandoSenha} className="bg-navy text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-navy-deep disabled:opacity-50 transition">
          {salvandoSenha ? 'Salvando...' : 'Trocar senha'}
        </button>
      </form>
    </div>
  )
}
