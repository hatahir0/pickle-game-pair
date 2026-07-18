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
  prevResting: number[]
  // 一度でもスケジュールに登場した（プレイまたは休憩した）か。
  // 途中参加直後の人を休憩に回さないための判定に使う。
  appeared: boolean[]
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
    prevResting: [],
    appeared: Array(numPlayers).fill(false),
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

  // 休憩者の選定: ⓪初登場の人（途中参加直後）は休憩に回さない ①累計休憩が少ない人
  // ②直前ゲームで休んでいない人 ③プレイ数が多い人。
  // ②がないと、回数タイのとき直前に休んだ人が再抽選され「連続休憩」が高頻度で起きる。
  // ⓪は初回生成では全員未登場（全員タイ）のため影響しない。
  const justRested = new Set(state.prevResting)
  const { appeared } = state
  const order = shuffle([...active], rng)
  order.sort(
    (a, b) =>
      Number(appeared[b]) - Number(appeared[a]) ||
      restCount[a] - restCount[b] ||
      Number(justRested.has(a)) - Number(justRested.has(b)) ||
      playCount[b] - playCount[a],
  )
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
  for (const p of playing) state.appeared[p] = true
  for (const r of resting) state.appeared[r] = true
  state.prevFoursomes = newFoursomes
  state.prevMates = newMates
  state.prevResting = resting
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
    for (const x of four) {
      playCount[x]++
      state.appeared[x] = true
    }
    newFoursomes.add([...four].sort((a, b) => a - b).join('-'))
    for (const x of four) for (const y of four) if (x !== y) newMates[x][y] = 1
  }
  for (const r of round.resting) {
    restCount[r]++
    state.appeared[r] = true
  }
  state.prevFoursomes = newFoursomes
  state.prevMates = newMates
  // 組み直し時の境界で連続休憩が起きないよう、直前の休憩者も引き継ぐ
  state.prevResting = [...round.resting]
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

// 途中参加者・復帰者を中立の状態で合流させる。休憩回数が既存メンバーの最小値より
// 低いままだと以後ずっと「最も休んでいない人」扱いで休憩に回され続けるため、
// 最小値まで引き上げる（下げはしない）。初戦は appeared=false が保護する。
function neutralizeNewcomers(state: State, active: number[]): void {
  const seen = active.filter((p) => state.appeared[p])
  if (seen.length === 0) return
  const minRest = Math.min(...seen.map((p) => state.restCount[p]))
  for (const p of active) {
    if (!state.appeared[p]) {
      state.restCount[p] = Math.max(state.restCount[p], minRest)
    }
  }
}

/**
 * 完了済みゲームは保持したまま、未完了ゲームだけを不参加者を除いて組み直す。
 * @param rounds          既存の全ゲーム
 * @param done            各ゲームの完了フラグ（rounds と同じ長さ）
 * @param numPlayers      参加者総数（番号空間サイズ・不変）
 * @param inactivePlayers 除外する番号（本日終了＋一時離脱中）
 * @param returning       一時離脱から戻る番号。初参加と同じ扱いで合流させる
 *                        （戻った直後に休憩へ回されないための保護つき）
 * @returns 完了済みは同一オブジェクトのまま、未完了は再生成した新しい配列
 */
export function regenerateRemaining(
  rounds: Round[],
  done: boolean[],
  numPlayers: number,
  inactivePlayers: number[],
  courts: number,
  rng: Rng = Math.random,
  returning: number[] = [],
): Round[] {
  const inactiveSet = new Set(inactivePlayers)
  const active = [...Array(numPlayers).keys()].filter((i) => !inactiveSet.has(i))
  if (active.length < 4) throw new Error('need at least 4 remaining players')

  const state = freshState(numPlayers)
  const result: Round[] = []
  let normalized = false
  for (let i = 0; i < rounds.length; i++) {
    if (done[i]) {
      foldPlayedRound(rounds[i], state)
      result.push(rounds[i])
      continue
    }
    if (!normalized) {
      normalized = true
      // 復帰者は過去に登場済みだが「戻ってきたばかり」なので初参加と同じ扱いに戻す
      for (const p of returning) {
        if (p >= 0 && p < numPlayers) state.appeared[p] = false
      }
      neutralizeNewcomers(state, active)
    }
    result.push(generateRound(active, courts, state, rng))
  }
  return result
}

/**
 * 既存の全ゲーム（完了・未完了とも）を前提の履歴として、末尾に count ゲームを追加する。
 * 既存ゲームには一切手を付けない。「多めに作ったが時間が余った」とき用。
 */
export function appendGames(
  rounds: Round[],
  numPlayers: number,
  inactivePlayers: number[],
  courts: number,
  count: number,
  rng: Rng = Math.random,
): Round[] {
  const inactiveSet = new Set(inactivePlayers)
  const active = [...Array(numPlayers).keys()].filter((i) => !inactiveSet.has(i))
  if (active.length < 4) throw new Error('need at least 4 active players')

  const state = freshState(numPlayers)
  for (const r of rounds) foldPlayedRound(r, state)
  neutralizeNewcomers(state, active)
  const added: Round[] = []
  for (let i = 0; i < count; i++) added.push(generateRound(active, courts, state, rng))
  return [...rounds, ...added]
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
