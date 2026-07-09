import { useEffect, useState } from 'react'
import { generateSchedule, regenerateRemaining } from './scheduler'
import { loadLang, messages, saveLang, type Lang } from './i18n'
import { clearSession, loadSession, saveSession, type Session } from './types'
import Setup from './Setup'
import Schedule from './Schedule'
import Summary from './Summary'
import PickleLogo from './PickleLogo'

type View = 'setup' | 'schedule' | 'summary'

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang())
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [view, setView] = useState<View>(session ? 'schedule' : 'setup')
  const t = messages[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const changeLang = (l: Lang) => {
    setLang(l)
    saveLang(l)
  }

  const start = (playerNames: string[], courts: number, totalGames: number) => {
    const rounds = generateSchedule(playerNames.length, courts, totalGames)
    const s: Session = {
      playerNames,
      courts,
      totalGames,
      rounds,
      done: rounds.map(() => false),
      leftPlayers: [],
    }
    setSession(s)
    saveSession(s)
    setView('schedule')
  }

  const update = (s: Session) => {
    setSession(s)
    saveSession(s)
  }

  const regenerate = () => {
    if (!session) return
    if (!window.confirm(t.confirmRegenerate)) return
    const done = session.rounds.map(() => false)
    const rounds = regenerateRemaining(
      session.rounds,
      done,
      session.playerNames.length,
      session.leftPlayers,
      session.courts,
    )
    update({ ...session, rounds, done })
  }

  const leave = (indices: number[]) => {
    if (!session || indices.length === 0) return
    const leftPlayers = Array.from(new Set([...session.leftPlayers, ...indices])).sort(
      (a, b) => a - b,
    )
    const rounds = regenerateRemaining(
      session.rounds,
      session.done,
      session.playerNames.length,
      leftPlayers,
      session.courts,
    )
    update({ ...session, rounds, leftPlayers })
  }

  const backToSetup = () => {
    if (!window.confirm(t.confirmNew)) return
    clearSession()
    setSession(null)
    setView('setup')
  }

  return (
    <>
      <div className="header">
        <span className="title">
          {view !== 'setup' && (
            <>
              <PickleLogo size={26} />
              {t.appName}
            </>
          )}
        </span>
        <div className="lang-toggle" role="group" aria-label="language">
          <button className={lang === 'ja' ? 'active' : ''} onClick={() => changeLang('ja')}>
            日本語
          </button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => changeLang('en')}>
            EN
          </button>
        </div>
      </div>

      {view === 'setup' && <Setup t={t} onStart={start} />}

      {view === 'schedule' && session && (
        <Schedule
          t={t}
          session={session}
          onUpdate={update}
          onSummary={() => setView('summary')}
          onRegenerate={regenerate}
          onBackToSetup={backToSetup}
          onLeave={leave}
        />
      )}

      {view === 'summary' && session && (
        <Summary
          t={t}
          session={session}
          onBack={() => setView('schedule')}
          onBackToSetup={backToSetup}
        />
      )}

      <footer className="app-credit">created by 002みたか</footer>
    </>
  )
}
