import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Toca o áudio de uma resposta do desafio de fluência. O bucket é privado:
// pede um link temporário (o banco só libera pro próprio aluno e pra equipe).
export function AudioResposta({ caminho }) {
  const [url, setUrl] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!caminho) return
    supabase.storage.from('respostas-audio').createSignedUrl(caminho, 60 * 60)
      .then(({ data, error }) => { if (error) setErro(true); else setUrl(data.signedUrl) })
  }, [caminho])

  if (!caminho) return null
  if (erro) return <p className="text-xs text-ink-faint">Audio unavailable.</p>
  return url ? <audio src={url} controls className="w-full h-10" /> : <p className="text-xs text-ink-faint">Loading audio…</p>
}
