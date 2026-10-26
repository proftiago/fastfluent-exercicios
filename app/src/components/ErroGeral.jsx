import { Component } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export class ErroGeral extends Component {
  constructor(props) {
    super(props)
    this.state = { temErro: false }
  }

  static getDerivedStateFromError() {
    return { temErro: true }
  }

  componentDidCatch(error, info) {
    console.error('Erro capturado:', error, info)
    Sentry.captureException(error, { extra: { componentStack: info?.componentStack } })
  }

  render() {
    if (!this.state.temErro) return this.props.children

    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-soft flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-amber" />
          </div>
          <p className="font-display text-lg font-semibold text-ink mb-1">Ops, algo deu errado</p>
          <p className="text-sm text-ink-soft mb-6">Já registramos o problema. Tenta recarregar a página — geralmente resolve.</p>
          <button onClick={() => window.location.reload()}
            className="pressionavel inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-deep transition">
            <RotateCcw size={15} /> Recarregar
          </button>
        </div>
      </div>
    )
  }
}
