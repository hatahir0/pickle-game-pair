// 利用状況ログを Google フォームへ送信する（管理者＝運営のみが回答シートで閲覧）。
// 登録・報告と同じ no-cors POST 方式。回答は専用の Google スプレッドシートに溜まる。
// 明示: この記録があることは登録画面で利用者に明言している。
import { getProfile } from './registration'

// ── 設定（利用ログ用の Google フォーム作成後にここだけ差し替える）─────────────
// フォームの記述式4問（イベント / 名前 / 所属 / 詳細）※全て「必須にしない」こと。
const USAGE_FORM_ID = '1FAIpQLSfy9Ee38uCK7sUd3Ll-_lLM3Ioj03YDx80PjKBB84atmHwioA'
const ENTRY = {
  event: 'entry.976229978',
  name: 'entry.95131866',
  org: 'entry.2129462384',
  detail: 'entry.2015990065',
}
// ────────────────────────────────────────────────────────────────────────

export type UsageEvent = '起動' | '組み合わせ作成'

const PING_KEY = 'pgp-usage-lastping'

export function isUsageConfigured(): boolean {
  return !USAGE_FORM_ID.startsWith('__') && !ENTRY.event.startsWith('__')
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// 起動イベントは 1端末1日1回だけ（＝日別アクティブ利用者数のカウント用）
function shouldSkipDailyPing(): boolean {
  if (localStorage.getItem(PING_KEY) === today()) return true
  localStorage.setItem(PING_KEY, today())
  return false
}

export async function logUsage(event: UsageEvent, detail = ''): Promise<void> {
  if (!isUsageConfigured()) return
  if (event === '起動' && shouldSkipDailyPing()) return

  const p = getProfile()
  const url = `https://docs.google.com/forms/d/e/${USAGE_FORM_ID}/formResponse`
  const body = new URLSearchParams()
  body.append(ENTRY.event, event)
  body.append(ENTRY.name, p?.name ?? '')
  body.append(ENTRY.org, p?.org ?? '')
  body.append(ENTRY.detail, detail)
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch {
    // best-effort（成否は判定できない・失敗しても利用を妨げない）
  }
}
