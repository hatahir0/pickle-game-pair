import {
  generateSchedule,
  regenerateRemaining,
  computeStats,
  countRepeatedPairs,
  mulberry32,
} from '../src/scheduler'
import type { Round } from '../src/scheduler'

let failures = 0

function check(cond: boolean, msg: string) {
  if (!cond) {
    failures++
    console.log(`  [NG] ${msg}`)
  }
}

function run(players: number, courts: number, games: number, seed: number) {
  const rounds = generateSchedule(players, courts, games, mulberry32(seed))
  const maxCourts = Math.min(courts, Math.floor(players / 4))
  const totalMatches = rounds.reduce((s, r) => s + r.games.length, 0)
  const stats = computeStats(rounds, players)
  const plays = stats.map((s) => s.plays)
  const rests = stats.map((s) => s.rests)
  const spread = Math.max(...plays) - Math.min(...plays)
  const restSpread = Math.max(...rests) - Math.min(...rests)

  check(rounds.length === games, `game count ${rounds.length} != ${games}`)
  for (const [i, r] of rounds.entries()) {
    check(r.games.length === maxCourts, `game ${i + 1} uses ${r.games.length} courts != ${maxCourts}`)
    const seen = new Set<number>()
    for (const g of r.games) {
      for (const p of [...g.pairA, ...g.pairB]) {
        check(!seen.has(p), `game ${i + 1}: player ${p} appears twice`)
        seen.add(p)
      }
    }
    for (const p of r.resting) check(!seen.has(p), `game ${i + 1}: resting player ${p} also plays`)
    check(seen.size + r.resting.length === players, `game ${i + 1}: player count mismatch`)
  }

  let sameFourConsecutive = 0
  for (let i = 1; i < rounds.length; i++) {
    const prev = new Set(
      rounds[i - 1].games.map((g) => [...g.pairA, ...g.pairB].sort((a, b) => a - b).join('-')),
    )
    for (const g of rounds[i].games) {
      const key = [...g.pairA, ...g.pairB].sort((a, b) => a - b).join('-')
      if (prev.has(key)) sameFourConsecutive++
    }
  }

  check(spread <= 2, `play count spread ${spread} > 2 (plays: ${plays.join(',')})`)
  check(restSpread <= 2, `rest count spread ${restSpread} > 2 (rests: ${rests.join(',')})`)

  console.log(
    `players=${players} courts=${courts} games=${games} seed=${seed}` +
      ` | ${maxCourts} court(s)/game, ${totalMatches} matches` +
      ` | plays ${Math.min(...plays)}-${Math.max(...plays)}` +
      ` | repeated pairs ${countRepeatedPairs(rounds)}` +
      ` | same-4 back-to-back ${sameFourConsecutive}`,
  )
}

function roundKey(r: Round): string {
  return JSON.stringify(r)
}

// 途中離脱：完了済みは保持し、未完了だけ離脱者を除いて組み直す
function runLeave(
  players: number,
  courts: number,
  games: number,
  doneCount: number,
  leaver: number,
  seed: number,
) {
  const rng = mulberry32(seed)
  const original = generateSchedule(players, courts, games, rng)
  const done = original.map((_, i) => i < doneCount)
  const rebuilt = regenerateRemaining(original, done, players, [leaver], courts, mulberry32(seed + 99))

  check(rebuilt.length === original.length, `leave: game count changed ${rebuilt.length} != ${original.length}`)

  // 1) 完了済みゲームは1バイトも変わらない
  for (let i = 0; i < doneCount; i++) {
    check(roundKey(rebuilt[i]) === roundKey(original[i]), `leave: done game ${i + 1} was modified`)
  }

  // 2) 未完了ゲームに離脱者が一切登場しない
  for (let i = doneCount; i < rebuilt.length; i++) {
    const r = rebuilt[i]
    const appears =
      r.games.some((g) => [...g.pairA, ...g.pairB].includes(leaver)) || r.resting.includes(leaver)
    check(!appears, `leave: leaver ${leaver} appears in rebuilt game ${i + 1}`)
    // プレイヤーの重複なし・4の倍数
    const seen = new Set<number>()
    for (const g of r.games) for (const p of [...g.pairA, ...g.pairB]) {
      check(!seen.has(p), `leave: game ${i + 1} player ${p} twice`)
      seen.add(p)
    }
  }

  // 3) 未完了ゲームの、残りメンバーのプレイ/休憩偏りが妥当
  const active = [...Array(players).keys()].filter((i) => i !== leaver)
  const tailStats = computeStats(rebuilt.slice(doneCount), players)
  const plays = active.map((i) => tailStats[i].plays)
  const rests = active.map((i) => tailStats[i].rests)
  const spread = Math.max(...plays) - Math.min(...plays)
  const restSpread = Math.max(...rests) - Math.min(...rests)
  check(spread <= 2, `leave: tail play spread ${spread} > 2 (${plays.join(',')})`)
  check(restSpread <= 2, `leave: tail rest spread ${restSpread} > 2 (${rests.join(',')})`)

  console.log(
    `leave players=${players} courts=${courts} games=${games} done=${doneCount} leaver=${leaver} seed=${seed}` +
      ` | tail plays ${Math.min(...plays)}-${Math.max(...plays)} | OK`,
  )
}

// 途中参加：人数を増やし、未完了ゲームだけ新メンバーを含めて組み直す
function runJoin(players: number, courts: number, games: number, doneCount: number, seed: number) {
  const original = generateSchedule(players, courts, games, mulberry32(seed))
  const done = original.map((_, i) => i < doneCount)
  const newNum = players + 1
  const joiner = players // 新メンバーの番号
  const rebuilt = regenerateRemaining(original, done, newNum, [], courts, mulberry32(seed + 7))

  check(rebuilt.length === original.length, `join: game count changed`)
  for (let i = 0; i < doneCount; i++) {
    check(roundKey(rebuilt[i]) === roundKey(original[i]), `join: done game ${i + 1} modified`)
  }
  // 完了済みに新メンバーは登場しない（当然）／未完了には登場しうる
  let joinerPlays = 0
  for (let i = doneCount; i < rebuilt.length; i++) {
    for (const g of rebuilt[i].games) if ([...g.pairA, ...g.pairB].includes(joiner)) joinerPlays++
  }
  check(joinerPlays > 0, `join: new player never appears in upcoming games`)

  const tailStats = computeStats(rebuilt.slice(doneCount), newNum)
  const plays = tailStats.map((s) => s.plays)
  const spread = Math.max(...plays) - Math.min(...plays)
  check(spread <= 2, `join: tail play spread ${spread} > 2 (${plays.join(',')})`)
  console.log(
    `join players=${players}->${newNum} done=${doneCount} seed=${seed}` +
      ` | joiner plays ${joinerPlays} in tail | OK`,
  )
}

// 4) 残り4人未満なら例外
function runLeaveTooFew() {
  const rounds = generateSchedule(5, 1, 6, mulberry32(1))
  const done = rounds.map(() => false)
  let threw = false
  try {
    regenerateRemaining(rounds, done, 5, [0, 1], 1, mulberry32(2))
  } catch {
    threw = true
  }
  check(threw, 'leave: expected throw when fewer than 4 remain')
  console.log('leave too-few guard | OK')
}

const configs: [number, number, number][] = [
  [8, 2, 15],
  [10, 2, 15],
  [12, 3, 15],
  [5, 1, 10],
  [4, 1, 15],
  [7, 2, 15],
  [16, 4, 20],
  [24, 6, 30],
  [9, 2, 15],
]

for (const [p, c, g] of configs) {
  for (const seed of [1, 2, 3]) run(p, c, g, seed)
}

console.log('\n--- mid-session leave ---')
for (const seed of [1, 2, 3]) {
  runLeave(8, 2, 15, 3, 5, seed) // 8人→7人（2コート→1コートに自然減）
  runLeave(12, 3, 15, 4, 2, seed) // 12人→11人
  runLeave(10, 2, 15, 0, 0, seed) // 開始前に離脱（全ゲーム組み直し）
}
console.log('\n--- mid-session join ---')
for (const seed of [1, 2, 3]) {
  runJoin(7, 2, 15, 3, seed) // 7人→8人（1コート→2コートに復帰しうる）
  runJoin(8, 2, 15, 5, seed) // 8人→9人
}
runLeaveTooFew()

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll checks passed')
