import { useState } from 'react'
import type { Messages } from './i18n'
import PickleLogo from './PickleLogo'
import { register, CONTACT_EMAIL, CONTACT_NAME, type Registration } from './registration'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register({ t, onDone }: { t: Messages; onDone: () => void }) {
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    const r: Registration = {
      name: name.trim(),
      org: org.trim(),
      email: email.trim(),
      source: source.trim(),
      ts: new Date().toISOString(),
    }
    if (!r.name || !r.org || !r.email || !r.source) {
      setError(t.regErrRequired)
      return
    }
    if (!EMAIL_RE.test(r.email)) {
      setError(t.regErrEmail)
      return
    }
    // 送信は best-effort（失敗しても登録は完了扱いで先へ進む）
    void register(r)
    onDone()
  }

  return (
    <>
      <div className="hero">
        <PickleLogo size={72} />
        <h1 className="reg-title">{t.regHeading}</h1>
        <p>{t.regSub}</p>
      </div>

      <div className="card">
        <div className="reg-field">
          <label htmlFor="reg-name">
            {t.regName} <span className="req">*</span>
          </label>
          <input
            id="reg-name"
            value={name}
            placeholder={t.regNamePh}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="reg-field">
          <label htmlFor="reg-org">
            {t.regOrg} <span className="req">*</span>
          </label>
          <input
            id="reg-org"
            value={org}
            placeholder={t.regOrgPh}
            maxLength={40}
            onChange={(e) => setOrg(e.target.value)}
          />
        </div>
        <div className="reg-field">
          <label htmlFor="reg-email">
            {t.regEmail} <span className="req">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            placeholder={t.regEmailPh}
            maxLength={80}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="reg-field">
          <label htmlFor="reg-source">
            {t.regSource} <span className="req">*</span>
          </label>
          <input
            id="reg-source"
            value={source}
            placeholder={t.regSourcePh}
            maxLength={40}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="hint warn reg-error">{error}</div>}

      <button className="btn-primary" onClick={submit}>
        {t.regSubmit}
      </button>

      <div className="reg-note">
        <span aria-hidden="true">✉️</span>
        <span>{t.regMailNote}</span>
      </div>

      <div className="reg-fine">
        <p>{t.regMadeNote}</p>
        <p className="reg-contact">
          <span className="reg-contact-label">{t.regContactLabel}</span>
          <br />
          {CONTACT_EMAIL}
          <br />
          {CONTACT_NAME}
        </p>
      </div>
    </>
  )
}
