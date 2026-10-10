import { supabase } from './supabase'
import type { Trimester, Course, Ev, Attendance } from './types'
import { ymd, addDays } from './utils'

// ── Trimesters ────────────────────────────────────────────────────────────────
export async function fetchTrimesters() {
  const { data, error } = await supabase.from('trimesters').select('*').order('start_date')
  if (error) throw error
  return data as Trimester[]
}

export async function createTrimester(t: Omit<Trimester, 'created_at'>) {
  const row = { ...t, created_at: new Date().toISOString() }
  const { error } = await supabase.from('trimesters').insert(row)
  if (error) throw error
  return row as Trimester
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

// id is passed in from the caller (generated client-side) so optimistic + real IDs always match
export async function saveCourse(c: Omit<Course, 'created_at'>): Promise<Course> {
  const row = { ...c, created_at: new Date().toISOString() }
  const { error } = await supabase.from('courses').insert(row)
  if (error) throw error
  return row as Course
}

export async function updateCourse(id: string, patch: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update(patch)
    .eq('id', id)
    .select()
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Course not found')
  return data[0] as Course
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

// id is passed in from caller so optimistic + real IDs always match
export async function saveEvent(e: Omit<Ev, 'created_at' | 'updated_at'>): Promise<Ev> {
  const now = new Date().toISOString()
  const row = { ...e, created_at: now, updated_at: now }
  const { error } = await supabase.from('events').insert(row)
  if (error) throw error
  return row as Ev
}

export async function updateEvent(id: string, patch: Partial<Ev>): Promise<Ev> {
  const { data, error } = await supabase
    .from('events')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Event not found')
  return data[0] as Ev
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// Recurring weekly sessions
export async function saveRecurringEvents(
  base: Omit<Ev, 'id' | 'created_at' | 'updated_at' | 'date' | 'recurring_group_id'>,
  startDate: string,
  weekdays: number[],
  until: string
): Promise<Ev[]> {
  const groupId = crypto.randomUUID()
  const rows: Omit<Ev, 'created_at' | 'updated_at'>[] = []
  let cur = new Date(startDate + 'T00:00:00')
  const end = new Date(until + 'T00:00:00')
  while (cur <= end) {
    const dow = cur.getDay() === 0 ? 6 : cur.getDay() - 1
    if (weekdays.includes(dow)) {
      rows.push({ ...base, id: crypto.randomUUID(), date: ymd(cur), recurring_group_id: groupId })
    }
    cur = addDays(cur, 1)
  }
  const now = new Date().toISOString()
  const full = rows.map(r => ({ ...r, created_at: now, updated_at: now }))
  const { error } = await supabase.from('events').insert(full)
  if (error) throw error
  return full as Ev[]
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
  const newId = crypto.randomUUID()
  const now = new Date().toISOString()
  const newEv: Ev = {
    ...original,
    id: newId,
    date: newDate,
    start_time: newStart,
    end_time: newEnd,
    room: newRoom,
    status: 'scheduled',
    linked_to: originalId,
    recurring_group_id: '',
    created_at: now,
    updated_at: now,
  }
  const [cancelled] = await Promise.all([
    updateEvent(originalId, { status: 'cancelled', linked_to: newId }),
    saveEvent(newEv),
  ])
  return { cancelled, created: newEv }
}

// ── Attendance ────────────────────────────────────────────────────────────────
export async function fetchAttendance() {
  const { data, error } = await supabase.from('attendance').select('*')
  if (error) throw error
  return data as Attendance[]
}

export async function upsertAttendance(a: Attendance) {
  const { error } = await supabase
    .from('attendance')
    .upsert({ ...a, updated_at: new Date().toISOString() }, { onConflict: 'event_id' })
  if (error) throw error
  return a
}
