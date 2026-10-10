import { supabase } from './supabase'
import type { Trimester, Course, Ev, Attendance, Profile } from './types'
import { ymd, addDays, defaultEnd } from './utils'

// ── Trimesters ────────────────────────────────────────────────────────────────
export async function fetchTrimesters() {
  const { data, error } = await supabase.from('trimesters').select('*').order('start_date')
  if (error) throw error
  return data as Trimester[]
}

export async function createTrimester(t: Omit<Trimester, 'id' | 'created_at'>) {
  const row = { ...t, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  const { data, error } = await supabase.from('trimesters').insert(row).select().single()
  if (error) throw error
  return data as Trimester
}

export async function deleteTrimester(id: string) {
  const { error } = await supabase.from('trimesters').delete().eq('id', id)
  if (error) throw error
}

// ── Courses ───────────────────────────────────────────────────────────────────
export async function fetchCourses() {
  const { data, error } = await supabase.from('courses').select('*').order('name')
  if (error) throw error
  return data as Course[]
}

export async function saveCourse(c: Omit<Course, 'id' | 'created_at'>): Promise<Course> {
  const row = { ...c, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  const { data, error } = await supabase.from('courses').insert(row).select().single()
  if (error) throw error
  return data as Course
}

export async function updateCourse(id: string, patch: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase.from('courses').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Course
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
}

// ── Events ────────────────────────────────────────────────────────────────────
export async function fetchEvents() {
  const { data, error } = await supabase.from('events').select('*').order('date').order('start_time')
  if (error) throw error
  return data as Ev[]
}

export async function saveEvent(e: Omit<Ev, 'id' | 'created_at' | 'updated_at'>): Promise<Ev> {
  const now = new Date().toISOString()
  const row = { ...e, id: crypto.randomUUID(), created_at: now, updated_at: now }
  const { data, error } = await supabase.from('events').insert(row).select().single()
  if (error) throw error
  return data as Ev
}

export async function updateEvent(id: string, patch: Partial<Ev>): Promise<Ev> {
  const { data, error } = await supabase
    .from('events').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data as Ev
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// Recurring weekly sessions
export async function saveRecurringEvents(
  base: Omit<Ev, 'id' | 'created_at' | 'updated_at' | 'date' | 'recurring_group_id'>,
  startDate: string,
  weekdays: number[],      // 0=Mon … 6=Sun
  until: string
): Promise<Ev[]> {
  const groupId = crypto.randomUUID()
  const rows: Omit<Ev, 'id' | 'created_at' | 'updated_at'>[] = []
  let cur = new Date(startDate + 'T00:00:00')
  const end = new Date(until + 'T00:00:00')
  while (cur <= end) {
    const dow = cur.getDay() === 0 ? 6 : cur.getDay() - 1 // Mon=0
    if (weekdays.includes(dow)) {
      rows.push({ ...base, date: ymd(cur), recurring_group_id: groupId })
    }
    cur = addDays(cur, 1)
  }
  const now = new Date().toISOString()
  const full = rows.map(r => ({ ...r, id: crypto.randomUUID(), created_at: now, updated_at: now }))
  const { data, error } = await supabase.from('events').insert(full).select()
  if (error) throw error
  return data as Ev[]
}

// Reschedule: cancel original, create new linked event
export async function rescheduleEvent(
  originalId: string,
  newDate: string,
  newStart: string,
  newEnd: string,
  newRoom: string,
  original: Ev
): Promise<{ cancelled: Ev; created: Ev }> {
  const [cancelled, created] = await Promise.all([
    updateEvent(originalId, { status: 'cancelled', linked_to: null }),
    saveEvent({ profile: original.profile, trimester_id: original.trimester_id, course_id: original.course_id, type: original.type, title: original.title, description: original.description, date: newDate, start_time: newStart, end_time: newEnd, room: newRoom, status: 'scheduled', linked_to: originalId, recurring_group_id: '' })
  ])
  return { cancelled, created }
}

// ── Attendance ────────────────────────────────────────────────────────────────
export async function fetchAttendance() {
  const { data, error } = await supabase.from('attendance').select('*')
  if (error) throw error
  return data as Attendance[]
}

export async function upsertAttendance(a: Attendance) {
  const { data, error } = await supabase
    .from('attendance').upsert({ ...a, updated_at: new Date().toISOString() }, { onConflict: 'event_id' }).select().single()
  if (error) throw error
  return data as Attendance
}
