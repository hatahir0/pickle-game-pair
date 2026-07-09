import { generateSchedule, computeStats, countRepeatedPairs, mulberry32 } from '../src/scheduler'

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

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll checks passed')
