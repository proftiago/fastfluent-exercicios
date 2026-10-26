import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: 'https://0af9051cbd7aba025f68d554560aee0f@o4511869989552128.ingest.us.sentry.io/4511870011506688',
  environment: import.meta.env.MODE,
})

const root = createRoot(document.getElementById('root'))
const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview')

if (preview) {
  import('./dev/PreviewTemas').then(({ PreviewTemas }) => root.render(<PreviewTemas tema={preview} />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
