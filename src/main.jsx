import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Mini from './components/Mini.jsx'

const isMini =
  typeof window !== 'undefined' &&
  !!window.__TAURI_INTERNALS__ &&
  window.location.hash === '#mini'

if (isMini) document.documentElement.classList.add('mini')

createRoot(document.getElementById('root')).render(
  <StrictMode>{isMini ? <Mini /> : <App />}</StrictMode>
)