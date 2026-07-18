import type { Messages } from './i18n'
import type { Session } from './types'
import { computeStats, countRepeatedPairs } from './scheduler'

export default function Summary({
  t,
  session,
  onBack,
  onHome,
}: {
  t: Messages
  session: Session
  onBack: () => void
  onHome: () => void
}) {
  const { rounds, playerNames, leftPlayers, pausedPlayers, done } = session
  const doneRounds = rounds.filter((_, i) => done[i])
  const doneCount = doneRounds.length
  const statsDone = computeStats(doneRounds, playerNames.length)
  const statsAll = computeStats(rounds, playerNames.length)
  const repeatedDone = countRepeatedPairs(doneRounds)
  const repeatedAll = countRepeatedPairs(rounds)
  const leftSet = new Set(leftPlayers)
  const pausedSet = new Set(pausedPlayers)
  const nameOf = (i: number) => playerNames[i] || String(i + 1)

  return (
    <>
      <div className="card">
        <h2 style={{ fontSize: 17, marginBottom: 4 }}>{t.summaryTitle}</h2>
        <p className="summary-progress">{t.summaryDone(doneCount, rounds.length)}</p>
        <table className="summary-table">
          <thead>
            <tr>
              <th>{t.colPlayer}</th>
              <th className="num">
                {t.colPlays}
                <span className="col-sub">{t.doneOverPlanned}</span>
              </th>
              <th className="num">
                {t.colRests}
                <span className="col-sub">{t.doneOverPlanned}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {statsDone.map((s, i) => (
              <tr key={i} className={leftSet.has(i) ? 'left-row' : ''}>
                <td>
                  {nameOf(i)}
                  {leftSet.has(i) && <span className="left-tag">🏠 {t.leftLabel}</span>}
                  {pausedSet.has(i) && <span className="left-tag">🚶 {t.pausedLabel}</span>}
                </td>
                <td className="num">
                  {s.plays}
                  <span className="of-planned"> / {statsAll[i].plays}</span>
                </td>
                <td className="num">
                  {s.rests}
                  <span className="of-planned"> / {statsAll[i].rests}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          {t.repeatedPairsBoth(repeatedDone, repeatedAll)}
        </p>
      </div>

      <div className="footer-links">
        <button className="btn-secondary" onClick={onBack}>
          {t.backToSchedule}
        </button>
        <button className="btn-secondary" onClick={onHome}>
          🏠 {t.newSession}
        </button>
      </div>
    </>
  )
}
