export interface Game {
  court: number
  pairA: [number, number]
  pairB: [number, number]
  pairARepeat: number
  pairBRepeat: number
}

export interface Round {
  games: Game[]
  resting: number[]
}

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function matrix(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n).fill(0))
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const W_PARTNER = 100
const W_OPPONENT = 12
const W_SAME_FOUR = 500
const W_RECENT_MATE = 5
const ITERATIONS = 500

/**
 * 生成中に持ち回る累積状態。プレイヤーは常に 0..numPlayers-1 の番号で管理し、
 * 途中離脱があってもこの番号空間はズラさない（行列サイズは numPlayers 固定）。
 */
interface State {
  numPlayers: number
  partner: number[][]
  opponent: number[][]
  restCount: number[]
  playCount: number[]
  prevFoursomes: Set<string>
  prevMates: number[][]
}

function freshState(numPlayers: number): State {
  return {
    numPlayers,
    partner: matrix(numPlayers),
    opponent: matrix(numPlayers),
    restCount: Array(numPlayers).fill(0),
    playCount: Array(numPlayers).fill(0),
    prevFoursomes: new Set<string>(),
    prevMates: matrix(numPlayers),
  }
}

function effectiveCourts(active: number, courts: number): number {
  return Math.max(1, Math.min(courts, Math.floor(active / 4)))
}

/**
 * アクティブな番号リストから1ゲーム分を生成し、state を更新して返す。
 * active が 0..N-1 全員 かつ state が初期値のとき、旧 generateSchedule と同一挙動になる。
 */
function generateRound(active: number[], courts: number, state: State, rng: Rng): Round {
  const { partner, opponent, restCount, playCount, prevFoursomes, prevMates } = state
  const gamesThisRound = effectiveCourts(active.length, courts)
  const needed = gamesThisRound * 4

  const order = shuffle([...active], rng)
  order.sort((a, b) => restCount[a] - restCount[b] || playCount[b] - playCount[a])
  const resting = order.slice(0, active.length - needed).sort((a, b) => a - b)
  const playing = order.slice(active.length - needed)

  let best: { court: number; pairA: [number, number]; pairB: [number, number] }[] | null = null
  let bestCost = Infinity

  for (let it = 0; it < ITERATIONS; it++) {
    const p = shuffle([...playing], rng)
    let cost = 0
    const games: { court: number; pairA: [number, number]; pairB: [number, number] }[] = []

    for (let c = 0; c < gamesThisRound; c++) {
      const four = p.slice(c * 4, c * 4 + 4)
      const options: [[number, number], [number, number]][] = [
        [[four[0], four[1]], [four[2], four[3]]],
        [[four[0], four[2]], [four[1], four[3]]],
        [[four[0], four[3]], [four[1], four[2]]],
      ]
      let bestPair = options[0]
      let bestPairCost = Infinity
      for (const [pa, pb] of options) {
        let c2 =
          W_PARTNER * partner[pa[0]][pa[1]] ** 2 +
          W_PARTNER * partner[pb[0]][pb[1]] ** 2
        for (const x of pa) for (const y of pb) c2 += W_OPPONENT * opponent[x][y]
        if (c2 < bestPairCost) {
          bestPairCost = c2
          bestPair = [pa, pb]
        }
      }
      cost += bestPairCost
      const key = [...four].sort((a, b) => a - b).join('-')
      if (prevFoursomes.has(key)) cost += W_SAME_FOUR
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++)
          if (prevMates[four[i]][four[j]]) cost += W_RECENT_MATE
      games.push({ court: c + 1, pairA: bestPair[0], pairB: bestPair[1] })
    }

    if (cost < bestCost) {
      bestCost = cost
      best = games
    }
    if (bestCost === 0 && it > 30) break
  }

  const newFoursomes = new Set<string>()
  const newMates = matrix(state.numPlayers)
  const committed: Game[] = best!.map((gm) => {
    const { pairA, pairB } = gm
    partner[pairA[0]][pairA[1]]++
    partner[pairA[1]][pairA[0]]++
    partner[pairB[0]][pairB[1]]++
    partner[pairB[1]][pairB[0]]++
    for (const x of pairA)
      for (const y of pairB) {
        opponent[x][y]++
        opponent[y][x]++
      }
    const four = [...pairA, ...pairB]
    for (const x of four) playCount[x]++
    newFoursomes.add([...four].sort((a, b) => a - b).join('-'))
    for (const x of four) for (const y of four) if (x !== y) newMates[x][y] = 1
    return {
      ...gm,
      pairARepeat: partner[pairA[0]][pairA[1]],
      pairBRepeat: partner[pairB[0]][pairB[1]],
    }
  })

  for (const r of resting) restCount[r]++
  state.prevFoursomes = newFoursomes
  state.prevMates = newMates
  return { games: committed, resting }
}

/**
 * 既にプレイ済みのゲーム内容を state に畳み込む（新規生成はしない）。
 * これで完了済みの履歴を引き継いだ上で残りゲームを組み直せる。
 */
function foldPlayedRound(round: Round, state: State): void {
  const { partner, opponent, restCount, playCount } = state
  const newFoursomes = new Set<string>()
  const newMates = matrix(state.numPlayers)
  for (const g of round.games) {
    const { pairA, pairB } = g
    partner[pairA[0]][pairA[1]]++
    partner[pairA[1]][pairA[0]]++
    partner[pairB[0]][pairB[1]]++
    partner[pairB[1]][pairB[0]]++
    for (const x of pairA)
      for (const y of pairB) {
        opponent[x][y]++
        opponent[y][x]++
      }
    const four = [...pairA, ...pairB]
    for (const x of four) playCount[x]++
    newFoursomes.add([...four].sort((a, b) => a - b).join('-'))
    for (const x of four) for (const y of four) if (x !== y) newMates[x][y] = 1
  }
  for (const r of round.resting) restCount[r]++
  state.prevFoursomes = newFoursomes
  state.prevMates = newMates
}

export function generateSchedule(
  numPlayers: number,
  courts: number,
  totalGames: number,
  rng: Rng = Math.random,
): Round[] {
  if (numPlayers < 4) throw new Error('need at least 4 players')
  const active = [...Array(numPlayers).keys()]
  const state = freshState(numPlayers)
  const rounds: Round[] = []
  for (let i = 0; i < totalGames; i++) rounds.push(generateRound(active, courts, state, rng))
  return rounds
}

/**
 * 完了済みゲームは保持したまま、未完了ゲームだけを離脱者を除いて組み直す。
 * @param rounds       既存の全ゲーム
 * @param done         各ゲームの完了フラグ（rounds と同じ長さ）
 * @param numPlayers   参加者総数（番号空間サイズ・不変）
 * @param leftPlayers  離脱した番号
 * @returns 完了済みは同一オブジェクトのまま、未完了は再生成した新しい配列
 */
export function regenerateRemaining(
  rounds: Round[],
  done: boolean[],
  numPlayers: number,
  leftPlayers: number[],
  courts: number,
  rng: Rng = Math.random,
): Round[] {
  const leftSet = new Set(leftPlayers)
  const active = [...Array(numPlayers).keys()].filter((i) => !leftSet.has(i))
  if (active.length < 4) throw new Error('need at least 4 remaining players')

  const state = freshState(numPlayers)
  return rounds.map((round, i) => {
    if (done[i]) {
      foldPlayedRound(round, state)
      return round
    }
    return generateRound(active, courts, state, rng)
  })
}

export interface PlayerStats {
  plays: number
  rests: number
}

export function computeStats(rounds: Round[], numPlayers: number): PlayerStats[] {
  const stats: PlayerStats[] = Array.from({ length: numPlayers }, () => ({ plays: 0, rests: 0 }))
  for (const round of rounds) {
    for (const g of round.games) {
      for (const p of [...g.pairA, ...g.pairB]) stats[p].plays++
    }
    for (const r of round.resting) stats[r].rests++
  }
  return stats
}

export function countRepeatedPairs(rounds: Round[]): number {
  const seen = new Map<string, number>()
  for (const round of rounds) {
    for (const g of round.games) {
      for (const pair of [g.pairA, g.pairB]) {
        const key = [...pair].sort((a, b) => a - b).join('-')
        seen.set(key, (seen.get(key) ?? 0) + 1)
      }
    }
  }
  let repeated = 0
  for (const count of seen.values()) if (count >= 2) repeated++
  return repeated
}
