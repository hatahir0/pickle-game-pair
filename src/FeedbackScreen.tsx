import { useState } from 'react'
import type { Messages } from './i18n'
import { submitFeedback, type FeedbackType } from './feedback'
import { getProfile } from './registration'
import PickleLogo from './PickleLogo'

export default function FeedbackScreen({ t, onClose }: { t: Messages; onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>('bug')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const profile = getProfile()

  const submit = () => {
    if (!content.trim()) {
      setError(t.feedbackErrRequired)
      return
    }
    // 送信は best-effort（成否は判定できないため optimistic に完了表示）
    void submitFeedback(type, content.trim())
    setSent(true)
  }

  if (sent) {
    return (
      <>
        <div className="hero">
          <PickleLogo size={72} />
          <h1 className="reg-title">{t.feedbackTitle}</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center' }}>{t.feedbackThanks}</p>
        </div>
        <button className="btn-primary" onClick={onClose}>
          {t.close}
        </button>
      </>
    )
  }

  return (
    <>
      <div className="hero">
        <PickleLogo size={72} />
        <h1 className="reg-title">{t.feedbackTitle}</h1>
        <p>{t.feedbackSub}</p>
      </div>

      <div className="card">
        <div className="fb-types" role="group" aria-label={t.feedbackTitle}>
          <button
            className={`fb-type ${type === 'bug' ? 'active' : ''}`}
            aria-pressed={type === 'bug'}
            onClick={() => setType('bug')}
          >
            {t.feedbackTypeBug}
          </button>
          <button
            className={`fb-type ${type === 'feature' ? 'active' : ''}`}
            aria-pressed={type === 'feature'}
            onClick={() => setType('feature')}
          >
            {t.feedbackTypeFeature}
          </button>
        </div>
        <textarea
          className="fb-content"
          value={content}
          placeholder={t.feedbackPlaceholder}
          rows={5}
          maxLength={1000}
          onChange={(e) => setContent(e.target.value)}
        />
        {profile && (
          <p className="fb-reporter">
            {t.feedbackReporter}: {profile.name}
            {profile.org ? `（${profile.org}）` : ''}
          </p>
        )}
        {error && <div className="hint warn">{error}</div>}
      </div>

      <button className="btn-primary" onClick={submit}>
        {t.feedbackSubmit}
      </button>

      <div className="footer-links">
        <button className="btn-secondary" onClick={onClose}>
          {t.cancel}
        </button>
      </div>
    </>
  )
}
