import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'

// Global resilience handler for stale Vite chunk errors across deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite preloadError] Reloading to fetch latest operational bundle:', event);
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
