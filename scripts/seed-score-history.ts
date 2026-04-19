import { execSync } from 'child_process'

// 8 weekly dates going back from today
const dates: string[] = []
const base = new Date()
for (let i = 1; i <= 8; i++) {
  const d = new Date(base)
  d.setDate(base.getDate() - i * 7)
  dates.push(d.toISOString().split('T')[0])
}
// oldest first
dates.reverse()

console.log(`\n🌱 Seeding score history for ${dates.length} dates:`)
dates.forEach(d => console.log(`   ${d}`))
console.log()

for (const date of dates) {
  console.log(`\n──── ${date} ────`)
  try {
    execSync(
      `pnpm tsx --env-file=.env.local scripts/compute-signal-scores.ts --date=${date}`,
      { stdio: 'inherit', cwd: process.cwd() }
    )
  } catch (err) {
    console.error(`Failed for ${date}:`, (err as Error).message)
    // continue to next date
  }
}

console.log('\n✅ Seed complete — run `pnpm signals` to score today with velocity data.')
