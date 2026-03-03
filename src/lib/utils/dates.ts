export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function getWeekStartString(date: Date = new Date()): string {
  return getWeekStart(date).toISOString().slice(0, 10)
}

export function formatWeekLabel(weekStartDate: string): string {
  const date = new Date(weekStartDate + 'T00:00:00Z')
  return `Week of ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })}`
}
