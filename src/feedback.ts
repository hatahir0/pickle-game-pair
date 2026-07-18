// ご意見・バグ報告を Google フォームへ送信する（一覧表示はしない・運営に届くだけ）。
// 登録と同じ no-cors POST 方式。回答は専用の Google スプレッドシートに溜まる。
import { getProfile } from './registration'

// ── 設定（ご意見・バグ報告用の Google フォーム作成後にここだけ差し替える）──────
// フォームの記述式3問（種別 / 内容 / 報告者）の entry.XXXX を記入。
// 未設定（プレースホルダ）の間は送信をスキップする。
const FEEDBACK_FORM_ID = '1FAIpQLScmv_wKnRGJZ9j0vCzPlytxejxDB38qy4P9TVaQHWpN_xppQw'
const ENTRY = {
  type: 'entry.1897860609',
  content: 'entry.714035354',
  reporter: 'entry.1492705956',
}
// ────────────────────────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'feature'

// シートの表記は言語に依存させず日本語で固定する
const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: 'バグ報告',
  feature: '機能追加',
}

export function isFeedbackConfigured(): boolean {
  return !FEEDBACK_FORM_ID.startsWith('__') && !ENTRY.type.startsWith('__')
}

function reporterLabel(): string {
  const p = getProfile()
  // 報告者はフォーム必須のため、プロフィール未登録でも空にしない
  if (!p || !p.name) return '（不明）'
  return p.org ? `${p.name}（${p.org}）` : p.name
}

// 送信を試みる。no-cors のため成否は判定できない（optimistic）。
export async function submitFeedback(type: FeedbackType, content: string): Promise<void> {
  if (!isFeedbackConfigured()) return
  const url = `https://docs.google.com/forms/d/e/${FEEDBACK_FORM_ID}/formResponse`
  const body = new URLSearchParams()
  body.append(ENTRY.type, TYPE_LABEL[type])
  body.append(ENTRY.content, content)
  body.append(ENTRY.reporter, reporterLabel())
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
}
