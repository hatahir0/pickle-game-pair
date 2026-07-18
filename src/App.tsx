import { useEffect, useState } from 'react'
import { renderSVG } from 'uqr'
import { appendGames, generateSchedule, regenerateRemaining } from './scheduler'
import { loadLang, messages, saveLang, type Lang } from './i18n'
import { clearSession, loadSession, saveSession, type Session } from './types'
import { flushPending, isRegistered, CONTACT_EMAIL, CONTACT_NAME } from './registration'
import { logUsage } from './usage'
import { hasDefaults } from './defaults'
import Setup from './Setup'
import Schedule from './Schedule'
import Summary from './Summary'
import Register from './Register'
import DefaultSettings from './DefaultSettings'
import Feedback from './FeedbackScreen'
import PickleLogo from './PickleLogo'

type View = 'setup' | 'schedule' | 'summary' | 'defaults' | 'feedback'

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang())
  const [registered, setRegistered] = useState<boolean>(() => isRegistered())
  const [defaultsSet, setDefaultsSet] = useState<boolean>(() => hasDefaults())
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [view, setView] = useState<View>(session ? 'schedule' : 'setup')
  const [returnView, setReturnView] = useState<View>('setup')
  const [showQr, setShowQr] = useState(false)
  const t = messages[lang]

  const onboarding = registered && !defaultsSet

  // 画面遷移は必ずこれを通す。ブラウザ履歴に積むことで、スマホの「戻る」ボタンで
  // アプリ内の前の画面に戻れる（サイト離脱しない）。
  const navigate = (v: View) => {
    setView(v)
    window.history.pushState({ view: v }, '')
  }

  // ホーム（設定画面）へ。進行中のセッションには一切触れない（安全なナビゲーション）
  const goHome = () => {
    if (!registered || !defaultsSet) return
    navigate('setup')
  }

  // 初回のデフォルト設定を終えたとき。機能追加前から残っている古いセッションが
  // あると、その古いスケジュール（前の設定・完了状態）へ自動復帰してしまうため、
  // ここで破棄し、決めたばかりのデフォルトで設定画面から始める。
  const finishOnboarding = () => {
    clearSession()
    setSession(null)
    setView('setup')
    window.history.replaceState({ view: 'setup' }, '')
    setDefaultsSet(true)
  }

  const openFeedback = () => {
    setReturnView(view)
    navigate('feedback')
  }

  // このアプリ自身のURL（クエリ・ハッシュは除く）をQRコードに
  const appUrl = window.location.origin + window.location.pathname

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    void flushPending()
    // 初期画面を履歴に記録（以降の pushState の起点）
    window.history.replaceState({ view }, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 利用状況ログ: 登録済みユーザーの起動を1日1回記録（日別アクティブ数の把握）
  useEffect(() => {
    if (registered) void logUsage('起動')
  }, [registered])

  // ブラウザの「戻る/進む」でアプリ内の画面を切り替える
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const state = e.state as { view?: View } | null
      let v: View = state?.view ?? 'setup'
      if ((v === 'schedule' || v === 'summary') && !session) v = 'setup'
      setView(v)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [session])

  const changeLang = (l: Lang) => {
    setLang(l)
    saveLang(l)
  }

  const start = (playerNames: string[], courts: number, totalGames: number) => {
    // 進行中のスケジュールがあるときだけ、上書きになることを確認する
    // （破壊的な操作はここ一箇所に集約。ナビゲーションでは何も消えない）
    if (session && !window.confirm(t.confirmOverwrite)) return
    const rounds = generateSchedule(playerNames.length, courts, totalGames)
    const s: Session = {
      playerNames,
      courts,
      totalGames,
      rounds,
      done: rounds.map(() => false),
      leftPlayers: [],
      pausedPlayers: [],
    }
    setSession(s)
    saveSession(s)
    void logUsage('組み合わせ作成', `${playerNames.length}人${courts}面${totalGames}ゲーム`)
    navigate('schedule')
  }

  const update = (s: Session) => {
    setSession(s)
    saveSession(s)
  }

  const inactiveOf = (s: Session) => [...s.leftPlayers, ...s.pausedPlayers]

  const regenerate = () => {
    if (!session) return
    if (!window.confirm(t.confirmRegenerate)) return
    const done = session.rounds.map(() => false)
    const rounds = regenerateRemaining(
      session.rounds,
      done,
      session.playerNames.length,
      inactiveOf(session),
      session.courts,
    )
    update({ ...session, rounds, done })
  }

  const leave = (indices: number[], permanent: boolean) => {
    if (!session || indices.length === 0) return
    const merge = (list: number[]) =>
      Array.from(new Set([...list, ...indices])).sort((a, b) => a - b)
    const leftPlayers = permanent ? merge(session.leftPlayers) : session.leftPlayers
    const pausedPlayers = permanent ? session.pausedPlayers : merge(session.pausedPlayers)
    const rounds = regenerateRemaining(
      session.rounds,
      session.done,
      session.playerNames.length,
      [...leftPlayers, ...pausedPlayers],
      session.courts,
    )
    update({ ...session, rounds, leftPlayers, pausedPlayers })
  }

  const returnPlayers = (indices: number[]) => {
    if (!session || indices.length === 0) return
    const back = new Set(indices)
    const pausedPlayers = session.pausedPlayers.filter((p) => !back.has(p))
    const rounds = regenerateRemaining(
      session.rounds,
      session.done,
      session.playerNames.length,
      [...session.leftPlayers, ...pausedPlayers],
      session.courts,
      undefined,
      indices,
    )
    update({ ...session, rounds, pausedPlayers })
  }

  const join = (name: string) => {
    if (!session || session.playerNames.length >= 24) return
    const playerNames = [...session.playerNames, name.trim()]
    const rounds = regenerateRemaining(
      session.rounds,
      session.done,
      playerNames.length,
      inactiveOf(session),
      session.courts,
    )
    update({ ...session, rounds, playerNames })
  }

  const addGame = () => {
    if (!session) return
    const rounds = appendGames(
      session.rounds,
      session.playerNames.length,
      inactiveOf(session),
      session.courts,
      1,
    )
    update({
      ...session,
      rounds,
      totalGames: session.totalGames + 1,
      done: [...session.done, false],
    })
  }

  // 現在地ラベル（ホーム以外の画面で表示）
  const locLabel =
    view === 'schedule'
      ? t.locSchedule
      : view === 'summary'
        ? t.barSummary
        : view === 'defaults'
          ? t.defaultsTitle
          : view === 'feedback'
            ? t.feedbackTitle
            : null

  return (
    <>
      <div className="header">
        <button className="home-link" onClick={goHome} aria-label={t.appName}>
          <PickleLogo size={26} />
          <span className="home-link-name">{t.appName}</span>
        </button>
        <div className="header-actions">
          <button
            className={`qr-button ${showQr ? 'active' : ''}`}
            aria-label={t.qrShare}
            aria-pressed={showQr}
            onClick={() => setShowQr(!showQr)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm-5 0h3v3h-3v-3zm0 5h3v3h-3v-3zm5 0h3v3h-3v-3z"
              />
            </svg>
          </button>
          <div className="lang-toggle" role="group" aria-label="language">
            <button className={lang === 'ja' ? 'active' : ''} onClick={() => changeLang('ja')}>
              日本語
            </button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => changeLang('en')}>
              EN
            </button>
          </div>
        </div>
      </div>

      {registered && defaultsSet && locLabel && (
        <div className="loc-label">🏠 › {locLabel}</div>
      )}

      {showQr && (
        <div className="card qr-card">
          <h2 className="qr-title">📱 {t.qrShare}</h2>
          <div
            className="qr-code"
            role="img"
            aria-label={appUrl}
            dangerouslySetInnerHTML={{ __html: renderSVG(appUrl) }}
          />
          <p className="qr-url">{appUrl}</p>
          <p className="qr-hint">{t.qrHint}</p>
          <button className="btn-secondary" onClick={() => setShowQr(false)}>
            {t.close}
          </button>
        </div>
      )}

      {!registered && <Register t={t} onDone={() => setRegistered(true)} />}

      {onboarding && (
        <DefaultSettings t={t} onboarding onSaved={finishOnboarding} />
      )}

      {registered && defaultsSet && view === 'defaults' && (
        <DefaultSettings
          t={t}
          onboarding={false}
          onSaved={() => navigate('setup')}
          onCancel={() => navigate('setup')}
        />
      )}

      {registered && defaultsSet && view === 'setup' && (
        <Setup
          t={t}
          onStart={start}
          onOpenDefaults={() => navigate('defaults')}
          resume={
            session
              ? { done: session.done.filter(Boolean).length, total: session.totalGames }
              : null
          }
          onResume={() => navigate('schedule')}
        />
      )}

      {registered && defaultsSet && view === 'schedule' && session && (
        <Schedule
          t={t}
          session={session}
          onUpdate={update}
          onSummary={() => navigate('summary')}
          onRegenerate={regenerate}
          onHome={goHome}
          onLeave={leave}
          onJoin={join}
          onReturn={returnPlayers}
          onAddGame={addGame}
        />
      )}

      {registered && defaultsSet && view === 'summary' && session && (
        <Summary
          t={t}
          session={session}
          onBack={() => navigate('schedule')}
          onHome={goHome}
        />
      )}

      {registered && defaultsSet && view === 'feedback' && (
        <Feedback t={t} onClose={() => navigate(returnView)} />
      )}

      <footer className="app-credit">
        {registered ? (
          <>
            {defaultsSet && view !== 'feedback' && (
              <p>
                <button className="feedback-link" onClick={openFeedback}>
                  💬 {t.feedbackTitle}
                </button>
              </p>
            )}
            <p>{t.regMadeNote}</p>
            <p className="credit-contact">
              {t.regContactLabel}: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              {' · '}
              {CONTACT_NAME}
            </p>
          </>
        ) : (
          'created by 002みたか'
        )}
      </footer>
    </>
  )
}
