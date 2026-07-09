import { useState } from 'react'
import type { Messages } from './i18n'
import PickleLogo from './PickleLogo'

const SETUP_KEY = 'pgp-setup-v1'

interface SetupValues {
  players: number
  courts: number
  games: number
  names: string[]
}

function loadSetup(): SetupValues {
  try {
    const raw = localStorage.getItem(SETUP_KEY)
    if (raw) {
      const s = JSON.parse(raw) as SetupValues
      if (s.players >= 4) return s
    }
  } catch {
    /* fall through */
  }
  return { players: 8, courts: 2, games: 15, names: [] }
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="stepper-row">
      <span className="label">{label}</span>
      <div className="stepper">
        <button aria-label={`${label} -`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <span className="value">{value}</span>
        <button aria-label={`${label} +`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          ＋
        </button>
      </div>
    </div>
  )
}

export default function Setup({
  t,
  onStart,
}: {
  t: Messages
  onStart: (playerNames: string[], courts: number, totalGames: number) => void
}) {
  const initial = loadSetup()
  const [players, setPlayers] = useState(initial.players)
  const [courts, setCourts] = useState(initial.courts)
  const [games, setGames] = useState(initial.games)
  const [names, setNames] = useState<string[]>(initial.names)

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
    localStorage.setItem(SETUP_KEY, JSON.stringify({ players, courts, games, names: playerNames }))
    onStart(playerNames, courts, games)
  }

  return (
    <>
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
    </>
  )
}
