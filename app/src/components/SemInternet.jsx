import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export function SemInternet() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    function aoFicarOnline() { setOnline(true) }
    function aoFicarOffline() { setOnline(false) }
    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    return () => {
      window.removeEventListener('online', aoFicarOnline)
      window.removeEventListener('offline', aoFicarOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber text-navy-deep text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 animar-entrada print:hidden">
      <WifiOff size={13} /> Sem conexão com a internet — algumas coisas podem não funcionar até você voltar a ficar online.
    </div>
  )
}
