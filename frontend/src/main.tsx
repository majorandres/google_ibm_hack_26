import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Landing from './Landing.tsx'

// Hash, not a path: the backend serves static files with no fallback for /app.
const isApp = () => ['#app', '#main'].includes(location.hash) // #main is the app's skip link

function Root() {
  const [inApp, setInApp] = useState(isApp)
  useEffect(() => {
    let current = isApp()
    const onHash = () => {
      const next = isApp()
      if (next === current) return // in-page jumps (#main, #top) keep their scroll
      current = next
      setInApp(next)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return inApp ? <App /> : <Landing />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
