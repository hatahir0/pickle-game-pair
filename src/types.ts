import type { Round } from './scheduler'

export interface Session {
  playerNames: string[]
  courts: number
  totalGames: number
  rounds: Round[]
  done: boolean[]
  leftPlayers: number[] // 本日終了（戻らない）
  pausedPlayers: number[] // 一時離脱（あとで戻る）
}

const SESSION_KEY = 'pgp-session-v1'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session & { currentRound?: number }
    if (!Array.isArray(s.rounds) || !Array.isArray(s.playerNames)) return null
    if (!Array.isArray(s.done) || s.done.length !== s.rounds.length) {
      const cr = typeof s.currentRound === 'number' ? s.currentRound : 0
      s.done = s.rounds.map((_, i) => i < cr)
    }
    if (!Array.isArray(s.leftPlayers)) s.leftPlayers = []
    if (!Array.isArray(s.pausedPlayers)) s.pausedPlayers = []
    return s
  } catch {
    return null
  }
}

export function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
