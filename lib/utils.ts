import type { Ev } from './types'

export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}

export const hhmm = (t: string | null | undefined): string => {
  if (!t) return ''
  const h = parseInt(t.slice(0, 2))
  const m = t.slice(3, 5)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === '00' ? `${h12}${ampm}` : `${h12}:${m}${ampm}`
}

export const defaultEnd = (start: string): string => {
  const h = parseInt(start.slice(0, 2))
  const m = parseInt(start.slice(3, 5))
  const total = h * 60 + m + 80
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const timeToMins = (t: string | null | undefined): number => {
  if (!t) return 0
  return parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(3, 5))
}

export const formatDateDisplay = (dateStr: string, opts?: Intl.DateTimeFormatOptions): string => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, opts || { weekday: 'short', month: 'short', day: 'numeric' })
}

export const formatDateFull = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export const getWeekDays = (date: Date): Date[] => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return Array.from({ length: 7 }, (_, i) => addDays(d, i))
}

export const getMonthDays = (year: number, month: number): (Date | null)[] => {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const start = first.getDay() === 0 ? 6 : first.getDay() - 1
  const days: (Date | null)[] = Array(start).fill(null)
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

// Returns event id → sequential number within its course+type group.
// Sessions: Session 1, 2… Tests: Quiz 1, 2… Exams: Exam 1, 2…
// Cancelled events are skipped so numbering stays clean.
export const sessionNumbers = (evs: Ev[]): Record<string, number> => {
  const map: Record<string, number> = {}
  const counters: Record<string, number> = {}
  const numbered = ['session', 'test', 'exam']
  const sorted = evs
    .filter(e => numbered.includes(e.type) && e.status !== 'cancelled')
    .sort((a, b) => (a.date + (a.start_time || '00:00')).localeCompare(b.date + (b.start_time || '00:00')))
  sorted.forEach(e => {
    const k = `${e.course_id || '__'}::${e.type}`
    counters[k] = (counters[k] || 0) + 1
    map[e.id] = counters[k]
  })
  return map
}

export const eventTitle = (e: Ev, courses: import('./types').Course[], nums: Record<string, number>): string => {
  if (e.title) return e.title
  const course = courses.find(c => c.id === e.course_id)
  if (e.type === 'session' && nums[e.id]) return `Session ${nums[e.id]}`
  if (e.type === 'test'    && nums[e.id]) return `Quiz ${nums[e.id]}`
  if (e.type === 'exam'    && nums[e.id]) return `Exam ${nums[e.id]}`
  if (course) return course.name
  return e.type.replace(/_/g, ' ')
}

export const isDashType = (type: string): boolean =>
  ['individual_assignment', 'individual_project', 'group_assignment', 'group_project'].includes(type)

export const getWeekGroups = (evs: Ev[]): { weekLabel: string; days: { date: string; evs: Ev[] }[] }[] => {
  const byDate: Record<string, Ev[]> = {}
  evs.forEach(e => { byDate[e.date] = [...(byDate[e.date] || []), e] })
  const dates = Object.keys(byDate).sort()
  if (!dates.length) return []
  const weeks: { weekLabel: string; days: { date: string; evs: Ev[] }[] }[] = []
  let cur: typeof weeks[0] | null = null
  dates.forEach(d => {
    const dt  = new Date(d + 'T00:00:00')
    const mon = addDays(dt, -(dt.getDay() === 0 ? 6 : dt.getDay() - 1))
    const label = `Week of ${mon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    if (!cur || cur.weekLabel !== label) { cur = { weekLabel: label, days: [] }; weeks.push(cur) }
    cur.days.push({ date: d, evs: byDate[d] })
  })
  return weeks
}
