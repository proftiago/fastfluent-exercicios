// Grava a fala do aluno: o áudio (MediaRecorder) e, quando o navegador
// oferece, a transcrição em inglês (Web Speech API — Chrome/Android/Safari).
// Sem reconhecimento de voz o aluno digita o que disse.

const Reconhecimento = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export const temReconhecimento = !!Reconhecimento
export const podeGravar = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

function tipoAudio() {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported?.(t)) return t
  }
  return ''
}

// Começa a gravar; devolve { parar } — parar() resolve com { blob, tipo, texto }
export async function comecarGravacao() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const tipo = tipoAudio()
  const gravador = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined)
  const pedacos = []
  gravador.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data) }
  gravador.start()

  let texto = ''
  let rec = null
  if (Reconhecimento) {
    rec = new Reconhecimento()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      texto = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim()
    }
    rec.onerror = () => {}
    try { rec.start() } catch { rec = null }
  }

  return {
    parar: () => new Promise((resolve) => {
      gravador.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        // o reconhecimento entrega o último trecho um pouco depois de parar
        setTimeout(() => resolve({ blob: new Blob(pedacos, { type: gravador.mimeType || tipo || 'audio/webm' }), tipo: gravador.mimeType || tipo, texto }), rec ? 700 : 0)
      }
      try { rec?.stop() } catch { /* já parado */ }
      gravador.stop()
    }),
  }
}

export function extensaoAudio(tipo) {
  if (/mp4|aac/.test(tipo)) return 'm4a'
  if (/ogg/.test(tipo)) return 'ogg'
  return 'webm'
}
