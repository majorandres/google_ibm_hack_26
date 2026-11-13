import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Landing from './Landing.tsx'

// Hash, not a path: the backend serves static files with no fallback for /app.
function Root() {
  const [inApp, setInApp] = useState(location.hash === '#app')
  useEffect(() => {
    const onHash = () => {
      setInApp(location.hash === '#app')
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
