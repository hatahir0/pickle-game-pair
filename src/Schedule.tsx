import { useEffect, useRef, useState } from 'react'
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
  onHome,
  onLeave,
  onJoin,
  onReturn,
  onAddGame,
}: {
  t: Messages
  session: Session
  onUpdate: (s: Session) => void
  onSummary: () => void
  onRegenerate: () => void
  onHome: () => void
  onLeave: (indices: number[], permanent: boolean) => void
  onJoin: (name: string) => void
  onReturn: (indices: number[]) => void
  onAddGame: () => void
}) {
  const { rounds, playerNames, totalGames, done, leftPlayers, pausedPlayers } = session
  const doneCount = done.filter(Boolean).length
  const finished = rounds.length > 0 && doneCount === rounds.length
  const firstOpen = done.findIndex((d) => !d)
  const currentRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const [panel, setPanel] = useState<'leave' | 'join' | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [pickedReturn, setPickedReturn] = useState<Set<number>>(new Set())
  const [joinName, setJoinName] = useState('')

  const inactiveSet = new Set([...leftPlayers, ...pausedPlayers])
  const activePlayers = playerNames.map((_, i) => i).filter((i) => !inactiveSet.has(i))
  const remainingAfter = activePlayers.length - picked.size
  const tooFew = remainingAfter < 4
  const joinFull = playerNames.length >= 24

  const nameOf = (i: number) => playerNames[i] || String(i + 1)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [firstOpen])

  useEffect(() => {
    if (panel) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [panel])

  const toggle = (i: number) => {
    const next = [...done]
    next[i] = !next[i]
    onUpdate({ ...session, done: next })
  }

  const togglePicked = (i: number) => {
    const next = new Set(picked)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setPicked(next)
  }

  const togglePickedReturn = (i: number) => {
    const next = new Set(pickedReturn)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setPickedReturn(next)
  }

  const closePanel = () => {
    setPanel(null)
    setPicked(new Set())
    setPickedReturn(new Set())
    setJoinName('')
  }

  const openPanel = (which: 'leave' | 'join') => {
    if (panel === which) closePanel()
    else {
      setPicked(new Set())
      setPickedReturn(new Set())
      setJoinName('')
      setPanel(which)
    }
  }

  const applyLeave = (permanent: boolean) => {
    if (picked.size === 0 || tooFew) return
    const names = [...picked].sort((a, b) => a - b).map(nameOf).join(t.sep)
    const confirmMsg = permanent ? t.leaveForDayConfirm(names) : t.leaveTempConfirm(names)
    if (!window.confirm(confirmMsg)) return
    onLeave([...picked], permanent)
    closePanel()
  }

  const applyReturn = () => {
    if (pickedReturn.size === 0) return
    const names = [...pickedReturn].sort((a, b) => a - b).map(nameOf).join(t.sep)
    if (!window.confirm(t.returnConfirm(names))) return
    onReturn([...pickedReturn])
    closePanel()
  }

  const applyJoin = () => {
    if (joinFull) return
    const display = joinName.trim() || String(playerNames.length + 1)
    if (!window.confirm(t.joinConfirm(display))) return
    onJoin(joinName)
    closePanel()
  }

  return (
    <>
      <div className="progress">{t.gamesProgress(doneCount, totalGames)}</div>

      {pausedPlayers.length > 0 && (
        <div className="left-note">
          <span aria-hidden="true">🚶</span>
          <span className="rest-label">{t.pausedLabel}</span>
          <span className="rest-chips">
            {[...pausedPlayers]
              .sort((a, b) => a - b)
              .map((p) => (
                <span key={p} className="chip left-chip">
                  {nameOf(p)}
                </span>
              ))}
          </span>
        </div>
      )}

      {leftPlayers.length > 0 && (
        <div className="left-note">
          <span aria-hidden="true">🏠</span>
          <span className="rest-label">{t.leftLabel}</span>
          <span className="rest-chips">
            {[...leftPlayers]
              .sort((a, b) => a - b)
              .map((p) => (
                <span key={p} className="chip left-chip">
                  {nameOf(p)}
                </span>
              ))}
          </span>
        </div>
      )}

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
              <span className="game-title">
                {t.game} {i + 1}
              </span>
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
            <button
              type="button"
              className={`game-done-btn ${isDone ? 'done' : ''}`}
              aria-pressed={isDone}
              onClick={() => toggle(i)}
            >
              {isDone ? t.gameUndo : t.gameFinish}
            </button>
          </div>
        )
      })}

      <button type="button" className="add-game-btn" onClick={onAddGame}>
        ＋ {t.addGame}
      </button>

      {finished && <div className="finished-banner">{t.finished}</div>}

      {!finished && panel === 'leave' && (
        <div className="leave-panel card" ref={panelRef}>
          <p className="leave-prompt">{t.leavePrompt}</p>
          <div className="leave-chips">
            {activePlayers.map((i) => (
              <button
                key={i}
                className={`chip pick-chip ${picked.has(i) ? 'picked' : ''}`}
                aria-pressed={picked.has(i)}
                onClick={() => togglePicked(i)}
              >
                {nameOf(i)}
              </button>
            ))}
          </div>
          {tooFew && picked.size > 0 && <div className="hint warn">{t.leaveTooFew}</div>}
          <div className="leave-actions">
            <button
              className="btn-primary"
              disabled={picked.size === 0 || tooFew}
              onClick={() => applyLeave(false)}
            >
              {t.leaveTempApply}
            </button>
            <button
              className="btn-primary leave-forday"
              disabled={picked.size === 0 || tooFew}
              onClick={() => applyLeave(true)}
            >
              {t.leaveForDayApply}
            </button>
            <button className="btn-secondary" onClick={closePanel}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {!finished && panel === 'join' && (
        <div className="leave-panel card" ref={panelRef}>
          {pausedPlayers.length > 0 && (
            <div className="return-section">
              <p className="leave-prompt">🚶 {t.returnPrompt}</p>
              <div className="leave-chips">
                {[...pausedPlayers]
                  .sort((a, b) => a - b)
                  .map((i) => (
                    <button
                      key={i}
                      className={`chip pick-chip ${pickedReturn.has(i) ? 'picked' : ''}`}
                      aria-pressed={pickedReturn.has(i)}
                      onClick={() => togglePickedReturn(i)}
                    >
                      {nameOf(i)}
                    </button>
                  ))}
              </div>
              <div className="leave-actions">
                <button
                  className="btn-primary"
                  disabled={pickedReturn.size === 0}
                  onClick={applyReturn}
                >
                  {t.returnApply}
                </button>
              </div>
              <hr className="panel-divider" />
            </div>
          )}
          <p className="leave-prompt">{t.joinPrompt}</p>
          {joinFull ? (
            <div className="hint warn">{t.joinLimit}</div>
          ) : (
            <>
              <div className="join-field">
                <span className="join-field-label">{t.joinNumberLabel}</span>
                <span className="chip">{playerNames.length + 1}</span>
              </div>
              <div className="join-field">
                <span className="join-field-label">{t.joinNameLabel}</span>
                <input
                  className="join-input"
                  value={joinName}
                  placeholder={t.joinNamePlaceholder}
                  maxLength={12}
                  onChange={(e) => setJoinName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyJoin()}
                />
              </div>
            </>
          )}
          <div className="leave-actions">
            {!joinFull && (
              <button className="btn-primary" onClick={applyJoin}>
                {t.joinApply}
              </button>
            )}
            <button className="btn-secondary" onClick={closePanel}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      <div className="action-bar">
        <button onClick={onSummary}>
          <span className="ico" aria-hidden="true">📊</span>
          {t.barSummary}
        </button>
        {!finished && (
          <button
            className={panel === 'leave' ? 'active' : ''}
            onClick={() => openPanel('leave')}
          >
            <span className="ico" aria-hidden="true">🚪</span>
            {t.barLeave}
          </button>
        )}
        {!finished && (
          <button className={panel === 'join' ? 'active' : ''} onClick={() => openPanel('join')}>
            <span className="ico" aria-hidden="true">🙋</span>
            {t.barJoin}
          </button>
        )}
        <button onClick={onRegenerate}>
          <span className="ico" aria-hidden="true">🔀</span>
          {t.barReshuffle}
        </button>
        <button onClick={onHome}>
          <span className="ico" aria-hidden="true">🏠</span>
          {t.barSetup}
        </button>
      </div>
    </>
  )
}
