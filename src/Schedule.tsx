import { useEffect, useRef } from 'react'
import type { Messages } from './i18n'
import type { Session } from './types'
import type { Game } from './scheduler'

function PairLabel({
  pair,
  repeat,
  nameOf,
  t,
}: {
  pair: [number, number]
  repeat: number
  nameOf: (i: number) => string
  t: Messages
}) {
  return (
    <span className="pair">
      <span className="chip">{nameOf(pair[0])}</span>
      <span className="chip">{nameOf(pair[1])}</span>
      {repeat >= 2 && <span className="repeat-badge">{t.pairRepeat(repeat)}</span>}
    </span>
  )
}

function CourtRow({ game, nameOf, t }: { game: Game; nameOf: (i: number) => string; t: Messages }) {
  return (
    <div className="court-row">
      <span className="court-label">
        {t.court} {game.court}
      </span>
      <div className="matchup">
        <PairLabel pair={game.pairA} repeat={game.pairARepeat} nameOf={nameOf} t={t} />
        <span className="vs">{t.vs}</span>
        <PairLabel pair={game.pairB} repeat={game.pairBRepeat} nameOf={nameOf} t={t} />
      </div>
    </div>
  )
}

export default function Schedule({
  t,
  session,
  onUpdate,
  onSummary,
  onRegenerate,
  onBackToSetup,
}: {
  t: Messages
  session: Session
  onUpdate: (s: Session) => void
  onSummary: () => void
  onRegenerate: () => void
  onBackToSetup: () => void
}) {
  const { rounds, playerNames, totalGames, done } = session
  const doneCount = done.filter(Boolean).length
  const finished = rounds.length > 0 && doneCount === rounds.length
  const firstOpen = done.findIndex((d) => !d)
  const currentRef = useRef<HTMLDivElement>(null)

  const nameOf = (i: number) => playerNames[i] || String(i + 1)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [firstOpen])

  const toggle = (i: number) => {
    const next = [...done]
    next[i] = !next[i]
    onUpdate({ ...session, done: next })
  }

  return (
    <>
      <div className="progress">{t.gamesProgress(doneCount, totalGames)}</div>

      {rounds.map((round, i) => {
        const isDone = done[i]
        const isCurrent = !isDone && i === firstOpen
        const state = isDone ? 'done' : isCurrent ? 'current' : 'upcoming'
        return (
          <div
            key={i}
            className={`round-card ${state}`}
            ref={isCurrent ? currentRef : undefined}
          >
            <div className="round-head">
              <label className="game-check-label">
                <input
                  type="checkbox"
                  className="game-check"
                  checked={isDone}
                  onChange={() => toggle(i)}
                  aria-label={`${t.game} ${i + 1}`}
                />
                <span className="game-title">
                  {t.game} {i + 1}
                </span>
              </label>
              {isCurrent && <span className="badge now">{t.current}</span>}
            </div>
            {round.games.map((g, j) => (
              <CourtRow key={j} game={g} nameOf={nameOf} t={t} />
            ))}
            <div className={`rest-row ${round.resting.length === 0 ? 'none' : ''}`}>
              <span aria-hidden="true">🪑</span>
              {round.resting.length === 0 ? (
                <span>{t.restNone}</span>
              ) : (
                <>
                  <span className="rest-label">{t.rest}</span>
                  <span className="rest-chips">
                    {round.resting.map((p) => (
                      <span key={p} className="chip rest-chip">
                        {nameOf(p)}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}

      {finished && (
        <>
          <div className="finished-banner">{t.finished}</div>
          <button className="btn-primary" onClick={onSummary}>
            📊 {t.toSummary}
          </button>
        </>
      )}

      <div className="footer-links">
        <button className="btn-secondary" onClick={onRegenerate}>
          🔀 {t.regenerate}
        </button>
        <button className="btn-secondary" onClick={onBackToSetup}>
          ⚙️ {t.newSession}
        </button>
      </div>
    </>
  )
}
