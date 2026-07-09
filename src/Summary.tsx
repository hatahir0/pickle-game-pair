import type { Messages } from './i18n'
import type { Session } from './types'
import { computeStats, countRepeatedPairs } from './scheduler'

export default function Summary({
  t,
  session,
  onBack,
  onBackToSetup,
}: {
  t: Messages
  session: Session
  onBack: () => void
  onBackToSetup: () => void
}) {
  const { rounds, playerNames } = session
  const stats = computeStats(rounds, playerNames.length)
  const repeated = countRepeatedPairs(rounds)
  const nameOf = (i: number) => playerNames[i] || String(i + 1)

  return (
    <>
      <div className="card">
        <h2 style={{ fontSize: 17, marginBottom: 12 }}>{t.summaryTitle}</h2>
        <table className="summary-table">
          <thead>
            <tr>
              <th>{t.colPlayer}</th>
              <th className="num">{t.colPlays}</th>
              <th className="num">{t.colRests}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={i}>
                <td>{nameOf(i)}</td>
                <td className="num">{s.plays}</td>
                <td className="num">{s.rests}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          {t.repeatedPairs(repeated)}
        </p>
      </div>

      <div className="footer-links">
        <button className="btn-secondary" onClick={onBack}>
          {t.backToSchedule}
        </button>
        <button className="btn-secondary" onClick={onBackToSetup}>
          ⚙️ {t.newSession}
        </button>
      </div>
    </>
  )
}
