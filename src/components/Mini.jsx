import { useEffect } from 'react'
import { t } from '../lib/i18n.js'

export default function Mini() {
  const act = (action) => {
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('mini_action', { action }))
      .catch(() => {})
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') act('close')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="mini-root">
      <div className="mini-card">
        <p className="mini-title">Hydrate 💧</p>
        <button className="mini-drink" onClick={() => act('drink')}>
          {t('tray.drink')}
        </button>
        <div className="mini-actions">
          <button className="mini-btn" onClick={() => act('later')}>
            {t('notify.browser.later')}
          </button>
          <button className="mini-icon" aria-label={t('mini.close')} onClick={() => act('close')}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}