// 初回アクセス時の利用者登録（氏名・所属・メール・きっかけ）を Google フォームへ送信する。
// サーバーを持たない静的サイトのまま、フォームの formResponse エンドポイントへ
// フォームエンコードで POST する（no-cors）。回答はフォームに紐づく Google スプレッドシートに溜まる。

// ── 設定（Google フォーム作成後にここだけ差し替える）────────────────────────
// 1. Google フォームを作成（記述式4問: 氏名 / 所属団体名 / メール / きっかけ）
// 2. フォームの「事前入力したURLを取得」から各設問の entry.XXXXXXXXX を控える
// 3. FORM_ID（.../d/e/○○○/viewform の ○○○）と ENTRY を下に記入
// 未設定（プレースホルダ）の間は送信をスキップし、ローカル保存のみ行う。
const FORM_ID = '1FAIpQLSdn90XHJXqrdCuz7SKtmIp27EnAvQ6DoZLm3xrIONhL65405w'
const ENTRY = {
  name: 'entry.689787335',
  org: 'entry.255083768',
  email: 'entry.81566984',
  source: 'entry.1151837912',
}
// ────────────────────────────────────────────────────────────────────────

export interface Registration {
  name: string
  org: string
  email: string
  source: string
  ts: string
}

const REGISTERED_KEY = 'pgp-registered-v1'
const PENDING_KEY = 'pgp-reg-pending-v1'

export function isRegistered(): boolean {
  return localStorage.getItem(REGISTERED_KEY) === '1'
}

function isConfigured(): boolean {
  return !FORM_ID.startsWith('__') && !ENTRY.name.startsWith('__')
}

function buildBody(r: Registration): URLSearchParams {
  const p = new URLSearchParams()
  p.append(ENTRY.name, r.name)
  p.append(ENTRY.org, r.org)
  p.append(ENTRY.email, r.email)
  p.append(ENTRY.source, r.source)
  return p
}

// フォームへ送信を試みる。no-cors のため成否は判定できない（optimistic）。
// 失敗（オフライン等）に備え、送るべき内容は呼び出し側が pending に退避しておく。
async function postToForm(r: Registration): Promise<void> {
  if (!isConfigured()) return
  const url = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildBody(r).toString(),
  })
}

// 登録を確定する。UX を止めないため、まずローカルに「登録済み」を記録し、
// 送信は best-effort。失敗しても pending に残し次回起動で再送する。
export async function register(r: Registration): Promise<void> {
  localStorage.setItem(REGISTERED_KEY, '1')
  localStorage.setItem(PENDING_KEY, JSON.stringify(r))
  try {
    await postToForm(r)
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // オフライン等。pending に残し、次回 flushPending で再送。
  }
}

// 起動時に呼ぶ。未送信の登録が残っていれば再送を試みる。
export async function flushPending(): Promise<void> {
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw || !isConfigured()) return
  try {
    const r = JSON.parse(raw) as Registration
    await postToForm(r)
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // 次回に持ち越し
  }
}

// 連絡先（画面表示用・翻訳しない固定値）
export const CONTACT_EMAIL = '002mitaka@googlegroups.com'
export const CONTACT_NAME = 'Hiroshi Hata'
