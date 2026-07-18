import {
  appendGames,
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

// 同一プレイヤーの最大連続休憩数（1なら「連続休憩なし」）
function maxConsecRest(rounds: Round[], players: number): number {
  const streak = Array(players).fill(0)
  let worst = 0
  for (const r of rounds) {
    const rest = new Set(r.resting)
    for (let i = 0; i < players; i++) {
      streak[i] = rest.has(i) ? streak[i] + 1 : 0
      if (streak[i] > worst) worst = streak[i]
    }
  }
  return worst
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
  const streak = maxConsecRest(rounds, players)
  check(streak <= 1, `same player rests ${streak} games in a row`)

  // 「多めに作って途中でやめる」運用の保証: どのゲーム数で切っても
  // 休憩・プレイ数の偏りが1以内に収まっていること（プレフィックス公平性）
  {
    const pr = Array(players).fill(0)
    const pp = Array(players).fill(0)
    for (const [i, r] of rounds.entries()) {
      for (const g of r.games) for (const p of [...g.pairA, ...g.pairB]) pp[p]++
      for (const p of r.resting) pr[p]++
      const rs = Math.max(...pr) - Math.min(...pr)
      const ps = Math.max(...pp) - Math.min(...pp)
      check(rs <= 1, `prefix @game${i + 1}: rest spread ${rs} > 1`)
      check(ps <= 1, `prefix @game${i + 1}: play spread ${ps} > 1`)
    }
  }

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
  const streak = maxConsecRest(rebuilt, players)
  check(streak <= 1, `leave: same player rests ${streak} games in a row (incl. boundary)`)

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
  const streak = maxConsecRest(rebuilt, newNum)
  check(streak <= 1, `join: same player rests ${streak} games in a row (incl. boundary)`)
  check(
    !rebuilt[doneCount].resting.includes(joiner),
    `join: new player is benched immediately on arrival`,
  )
  console.log(
    `join players=${players}->${newNum} done=${doneCount} seed=${seed}` +
      ` | joiner plays ${joinerPlays} in tail | OK`,
  )
}

// 一時離脱→復帰：完了分は保持・離脱中は不在・復帰後は再登場し、復帰直後に休憩へ回さない
function runReturn(
  players: number,
  courts: number,
  games: number,
  k1: number, // ここまで完了して一時離脱
  k2: number, // ここまで完了して復帰
  x: number, // 一時離脱する番号
  seed: number,
) {
  const original = generateSchedule(players, courts, games, mulberry32(seed))
  const done1 = original.map((_, i) => i < k1)
  const paused = regenerateRemaining(original, done1, players, [x], courts, mulberry32(seed + 11))
  const done2 = paused.map((_, i) => i < k2)
  const returned = regenerateRemaining(
    paused,
    done2,
    players,
    [],
    courts,
    mulberry32(seed + 22),
    [x],
  )

  check(returned.length === games, 'return: game count changed')
  for (let i = 0; i < k2; i++) {
    check(roundKey(returned[i]) === roundKey(paused[i]), `return: done game ${i + 1} modified`)
  }
  for (let i = k1; i < k2; i++) {
    const r = returned[i]
    const appears =
      r.games.some((g) => [...g.pairA, ...g.pairB].includes(x)) || r.resting.includes(x)
    check(!appears, `return: paused player appears in game ${i + 1}`)
  }
  let plays = 0
  for (let i = k2; i < games; i++) {
    for (const g of returned[i].games) if ([...g.pairA, ...g.pairB].includes(x)) plays++
  }
  check(plays > 0, 'return: player never appears after returning')
  check(!returned[k2].resting.includes(x), 'return: player benched immediately on return')
  const streak = maxConsecRest(returned, players)
  check(streak <= 1, `return: same player rests ${streak} games in a row`)
  console.log(
    `return players=${players} pause@${k1} back@${k2} x=${x} seed=${seed}` +
      ` | plays after return ${plays} | OK`,
  )
}

// ゲーム追加：既存の全ゲームは一切変えず、末尾に追加する
function runAppend(
  players: number,
  courts: number,
  games: number,
  addCount: number,
  leaver: number | null, // 不参加のまま追加するケース
  seed: number,
) {
  const original = generateSchedule(players, courts, games, mulberry32(seed))
  const inactive = leaver === null ? [] : [leaver]
  const appended = appendGames(original, players, inactive, courts, addCount, mulberry32(seed + 5))

  check(
    appended.length === games + addCount,
    `append: length ${appended.length} != ${games + addCount}`,
  )
  for (let i = 0; i < games; i++) {
    check(roundKey(appended[i]) === roundKey(original[i]), `append: existing game ${i + 1} modified`)
  }
  for (let i = games; i < appended.length; i++) {
    const r = appended[i]
    const seen = new Set<number>()
    for (const g of r.games)
      for (const p of [...g.pairA, ...g.pairB]) {
        check(!seen.has(p), `append: game ${i + 1} player ${p} twice`)
        seen.add(p)
      }
    if (leaver !== null) {
      const appears =
        r.games.some((g) => [...g.pairA, ...g.pairB].includes(leaver)) || r.resting.includes(leaver)
      check(!appears, `append: inactive player in added game ${i + 1}`)
    }
  }
  const streak = maxConsecRest(appended, players)
  check(streak <= 1, `append: same player rests ${streak} games in a row (incl. boundary)`)
  if (leaver === null) {
    // 全員参加なら、追加後も休憩の偏りは1以内のまま（途中終了公平性の継続）
    const stats = computeStats(appended, players)
    const rests = stats.map((s) => s.rests)
    check(Math.max(...rests) - Math.min(...rests) <= 1, `append: rest spread > 1`)
  }
  console.log(`append players=${players} games=${games}+${addCount} leaver=${leaver ?? '-'} seed=${seed} | OK`)
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
  [11, 2, 10],
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
  runJoin(10, 2, 10, 4, seed) // 10人→11人（報告のあった11人2面構成）
}

console.log('\n--- pause & return ---')
for (const seed of [1, 2, 3]) {
  runReturn(10, 2, 15, 3, 6, 2, seed) // 10人、3完了で一時離脱→6完了で復帰
  runReturn(11, 2, 10, 2, 5, 7, seed) // 11人2面
  runReturn(8, 2, 15, 4, 8, 0, seed) // 8人2面
}

console.log('\n--- append games ---')
for (const seed of [1, 2, 3]) {
  runAppend(9, 2, 12, 3, null, seed) // 9人2面、3ゲーム追加
  runAppend(11, 2, 10, 1, null, seed) // 11人2面、1ゲーム追加
  runAppend(10, 2, 8, 2, 3, seed) // 1人不参加のまま2ゲーム追加
}
runLeaveTooFew()

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll checks passed')
