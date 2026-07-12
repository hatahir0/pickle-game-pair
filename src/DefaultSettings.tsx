import { useState } from 'react'
import type { Messages } from './i18n'
import { loadDefaults, saveDefaults } from './defaults'
import Stepper from './Stepper'
import PickleLogo from './PickleLogo'

export default function DefaultSettings({
  t,
  onboarding,
  onSaved,
  onCancel,
}: {
  t: Messages
  onboarding: boolean
  onSaved: () => void
  onCancel?: () => void
}) {
  const initial = loadDefaults()
  const [players, setPlayers] = useState(initial.players)
  const [courts, setCourts] = useState(initial.courts)
  const [games, setGames] = useState(initial.games)

  const effectiveCourts = Math.min(courts, Math.floor(players / 4))

  const save = () => {
    saveDefaults({ players, courts, games })
    onSaved()
  }

  return (
    <>
      <div className="hero">
        <PickleLogo size={72} />
        <h1 className="reg-title">{t.defaultsTitle}</h1>
        <p>{t.defaultsSub}</p>
      </div>

      <div className="card">
        <Stepper label={t.players} value={players} min={4} max={24} onChange={setPlayers} />
        <Stepper label={t.courts} value={courts} min={1} max={6} onChange={setCourts} />
        <Stepper label={t.games} value={games} min={1} max={40} onChange={setGames} />
        {effectiveCourts < courts && <div className="hint">{t.effectiveCourts(effectiveCourts)}</div>}
      </div>

      <button className="btn-primary" onClick={save}>
        {onboarding ? t.defaultsSaveStart : t.defaultsSave}
      </button>

      {!onboarding && onCancel && (
        <div className="footer-links">
          <button className="btn-secondary" onClick={onCancel}>
            {t.cancel}
          </button>
        </div>
      )}
    </>
  )
}
