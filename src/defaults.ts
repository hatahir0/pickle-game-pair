// 登録者が明示的に設定する「デフォルト値」（毎回の設定画面の初期値）。
// 前回使った値ではなく、ここで決めた値から常に始まる。

export interface Defaults {
  players: number
  courts: number
  games: number
}

const DEFAULTS_KEY = 'pgp-defaults-v1'
const FALLBACK: Defaults = { players: 8, courts: 2, games: 15 }

// デフォルトが未設定なら true（登録直後に一度だけ設定画面へ誘導するため）
export function hasDefaults(): boolean {
  return localStorage.getItem(DEFAULTS_KEY) !== null
}

export function loadDefaults(): Defaults {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY)
    if (raw) {
      const d = JSON.parse(raw) as Defaults
      if (d.players >= 4 && d.courts >= 1 && d.games >= 1) return d
    }
  } catch {
    /* fall through */
  }
  return { ...FALLBACK }
}

export function saveDefaults(d: Defaults) {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(d))
}
