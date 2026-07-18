import { useState } from 'react'
import type { Messages } from './i18n'
import { loadDefaults } from './defaults'
import Stepper from './Stepper'
import PickleLogo from './PickleLogo'

const NAMES_KEY = 'pgp-names-v1'

function loadNames(): string[] {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    if (raw) {
      const n = JSON.parse(raw)
      if (Array.isArray(n)) return n
    }
  } catch {
    /* fall through */
  }
  return []
}

export default function Setup({
  t,
  onStart,
  onOpenDefaults,
  resume,
  onResume,
}: {
  t: Messages
  onStart: (playerNames: string[], courts: number, totalGames: number) => void
  onOpenDefaults: () => void
  resume: { done: number; total: number } | null
  onResume: () => void
}) {
  const initial = loadDefaults()
  const [players, setPlayers] = useState(initial.players)
  const [courts, setCourts] = useState(initial.courts)
  const [games, setGames] = useState(initial.games)
  const [names, setNames] = useState<string[]>(() => loadNames())

  const effectiveCourts = Math.min(courts, Math.floor(players / 4))
  const hasAnyName = names.some((n) => (n ?? '').trim() !== '')

  const setName = (i: number, v: string) => {
    const next = [...names]
    while (next.length < players) next.push('')
    next[i] = v
    setNames(next)
  }

  const clearNames = () => setNames([])

  const start = () => {
    const playerNames = Array.from({ length: players }, (_, i) => (names[i] ?? '').trim())
    localStorage.setItem(NAMES_KEY, JSON.stringify(playerNames))
    onStart(playerNames, courts, games)
  }

  return (
    <>
      {resume && (
        <button type="button" className="resume-banner" onClick={onResume}>
          {t.resumeBanner(resume.done, resume.total)}
        </button>
      )}

      <div className="hero">
        <PickleLogo size={88} />
        <h1>{t.appName}</h1>
        <p>{t.tagline}</p>
      </div>

      <div className="card">
        <Stepper label={t.players} value={players} min={4} max={24} onChange={setPlayers} />
        <Stepper label={t.courts} value={courts} min={1} max={6} onChange={setCourts} />
        <Stepper label={t.games} value={games} min={1} max={40} onChange={setGames} />
        {effectiveCourts < courts && <div className="hint">{t.effectiveCourts(effectiveCourts)}</div>}
      </div>

      <details className="names" open={hasAnyName}>
        <summary className="names-summary">
          <span className="names-summary-label">
            <span aria-hidden="true">✏️</span> {t.playerNames}
          </span>
          <span className="names-chevron" aria-hidden="true">▾</span>
        </summary>
        <p className="names-hint">{t.playerNamesHint}</p>
        <div className="names-actions">
          <button
            type="button"
            className="clear-names"
            disabled={!hasAnyName}
            onClick={clearNames}
          >
            {t.clearNames}
          </button>
        </div>
        <div className="names-grid">
          {Array.from({ length: players }, (_, i) => (
            <input
              key={i}
              value={names[i] ?? ''}
              placeholder={t.namePlaceholder(i + 1)}
              maxLength={12}
              onChange={(e) => setName(i, e.target.value)}
            />
          ))}
        </div>
      </details>

      <button className="btn-primary" onClick={start}>
        {t.generate}
      </button>

      <div className="footer-links">
        <button className="btn-secondary" onClick={onOpenDefaults}>
          ⚙️ {t.defaultsTitle}
        </button>
      </div>
    </>
  )
}
