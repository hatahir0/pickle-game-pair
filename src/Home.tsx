import type { Messages } from './i18n'
import PickleLogo from './PickleLogo'

// ホーム＝玄関。作業はせず、大きなメニューで行き先を選ぶだけの画面。
export default function Home({
  t,
  resume,
  onResume,
  onNew,
  onDefaults,
  onQr,
  onFeedback,
}: {
  t: Messages
  resume: { done: number; total: number; players: number; courts: number } | null
  onResume: () => void
  onNew: () => void
  onDefaults: () => void
  onQr: () => void
  onFeedback: () => void
}) {
  return (
    <>
      <div className="hero">
        <PickleLogo size={88} />
        <h1>{t.appName}</h1>
        <p>{t.tagline}</p>
      </div>

      {resume && (
        <button type="button" className="resume-banner" onClick={onResume}>
          {t.resumeBanner(resume.done, resume.total)}
          <span className="resume-sub">{t.resumeSub(resume.players, resume.courts)}</span>
        </button>
      )}

      <button type="button" className="menu-item" onClick={onNew}>
        <span className="menu-ico" aria-hidden="true">🆕</span>
        <span className="menu-text">
          <span className="menu-title">{t.menuNew}</span>
          <span className="menu-sub">{t.menuNewSub}</span>
        </span>
      </button>

      <button type="button" className="menu-item" onClick={onDefaults}>
        <span className="menu-ico" aria-hidden="true">⚙️</span>
        <span className="menu-text">
          <span className="menu-title">{t.defaultsTitle}</span>
          <span className="menu-sub">{t.menuDefaultsSub}</span>
        </span>
      </button>

      <button type="button" className="menu-item" onClick={onQr}>
        <span className="menu-ico" aria-hidden="true">📱</span>
        <span className="menu-text">
          <span className="menu-title">{t.menuQrTitle}</span>
          <span className="menu-sub">{t.menuQrSub}</span>
        </span>
      </button>

      <button type="button" className="menu-item" onClick={onFeedback}>
        <span className="menu-ico" aria-hidden="true">💬</span>
        <span className="menu-text">
          <span className="menu-title">{t.feedbackTitle}</span>
          <span className="menu-sub">{t.menuFeedbackSub}</span>
        </span>
      </button>
    </>
  )
}
