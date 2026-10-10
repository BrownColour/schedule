'use client'
import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode, useReducer
} from 'react'
import type { Profile, Trimester, Course, Ev, Attendance } from './types'
import * as api from './api'

interface AppState {
  profile: Profile | null
  activeTriId: string | null
  trimesters: Trimester[]
  courses: Course[]
  events: Ev[]
  attendance: Attendance[]
  toast: { msg: string; id: number } | null
  theme: 'dark' | 'light'
  loading: boolean
}

type Action =
  | { type: 'SET_PROFILE'; profile: Profile }
  | { type: 'SET_ACTIVE_TRI'; id: string | null }
  | { type: 'SET_TRIMESTERS'; data: Trimester[] }
  | { type: 'SET_COURSES'; data: Course[] }
  | { type: 'SET_EVENTS'; data: Ev[] }
  | { type: 'SET_ATTENDANCE'; data: Attendance[] }
  | { type: 'OPT_ADD_EVENT'; ev: Ev }
  | { type: 'OPT_UPDATE_EVENT'; ev: Ev }
  | { type: 'OPT_REMOVE_EVENT'; id: string }
  | { type: 'OPT_ADD_EVENTS'; evs: Ev[] }
  | { type: 'OPT_ADD_COURSE'; course: Course }
  | { type: 'OPT_UPDATE_COURSE'; course: Course }
  | { type: 'OPT_REMOVE_COURSE'; id: string }
  | { type: 'OPT_ADD_TRIMESTER'; t: Trimester }
  | { type: 'OPT_REMOVE_TRIMESTER'; id: string }
  | { type: 'OPT_UPSERT_ATTENDANCE'; a: Attendance }
  | { type: 'TOAST'; msg: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'SET_LOADING'; v: boolean }

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'SET_PROFILE': return { ...s, profile: a.profile }
    case 'SET_ACTIVE_TRI': return { ...s, activeTriId: a.id }
    case 'SET_TRIMESTERS': return { ...s, trimesters: a.data }
    case 'SET_COURSES': return { ...s, courses: a.data }
    case 'SET_EVENTS': return { ...s, events: a.data }
    case 'SET_ATTENDANCE': return { ...s, attendance: a.data }
    case 'OPT_ADD_EVENT': return { ...s, events: [...s.events, a.ev] }
    case 'OPT_UPDATE_EVENT': return { ...s, events: s.events.map(e => e.id === a.ev.id ? a.ev : e) }
    case 'OPT_REMOVE_EVENT': return { ...s, events: s.events.filter(e => e.id !== a.id) }
    case 'OPT_ADD_EVENTS': return { ...s, events: [...s.events, ...a.evs] }
    case 'OPT_ADD_COURSE': return { ...s, courses: [...s.courses, a.course] }
    case 'OPT_UPDATE_COURSE': return { ...s, courses: s.courses.map(c => c.id === a.course.id ? a.course : c) }
    case 'OPT_REMOVE_COURSE': return { ...s, courses: s.courses.filter(c => c.id !== a.id) }
    case 'OPT_ADD_TRIMESTER': return { ...s, trimesters: [...s.trimesters, a.t] }
    case 'OPT_REMOVE_TRIMESTER': return { ...s, trimesters: s.trimesters.filter(t => t.id !== a.id) }
    case 'OPT_UPSERT_ATTENDANCE': return { ...s, attendance: [...s.attendance.filter(x => x.event_id !== a.a.event_id), a.a] }
    case 'TOAST': return { ...s, toast: { msg: a.msg, id: Date.now() } }
    case 'CLEAR_TOAST': return { ...s, toast: null }
    case 'SET_THEME': return { ...s, theme: a.theme }
    case 'SET_LOADING': return { ...s, loading: a.v }
    default: return s
  }
}

const initial: AppState = {
  profile: null, activeTriId: null,
  trimesters: [], courses: [], events: [], attendance: [],
  toast: null, theme: 'dark', loading: false
}

interface Ctx extends AppState {
  setProfile: (p: Profile) => void
  setActiveTri: (id: string | null) => void
  setTheme: (t: 'dark' | 'light') => void
  addEvent: (e: Omit<Ev, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateEvent: (id: string, patch: Partial<Ev>) => Promise<void>
  removeEvent: (id: string) => Promise<void>
  addRecurringEvents: (base: Omit<Ev, 'id'|'created_at'|'updated_at'|'date'|'recurring_group_id'>, start: string, days: number[], until: string) => Promise<void>
  rescheduleEvent: (id: string, date: string, start: string, end: string, room: string) => Promise<void>
  addCourse: (c: Omit<Course, 'id' | 'created_at'>) => Promise<void>
  updateCourse: (id: string, patch: Partial<Course>) => Promise<void>
  removeCourse: (id: string) => Promise<void>
  addTrimester: (t: Omit<Trimester, 'id' | 'created_at'>) => Promise<void>
  removeTrimester: (id: string) => Promise<void>
  setAttendance: (eventId: string, status: import('./types').AttendanceStatus, courseId: string | null, date: string) => Promise<void>
  reload: () => Promise<void>
}

const C = createContext<Ctx>(null as any)
export const useApp = () => useContext(C)

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, initial)

  const toast = useCallback((msg: string) => {
    dispatch({ type: 'TOAST', msg })
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500)
  }, [])

  const load = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', v: true })
    try {
      const [tri, courses, events, att] = await Promise.all([
        api.fetchTrimesters(), api.fetchCourses(), api.fetchEvents(), api.fetchAttendance()
      ])
      dispatch({ type: 'SET_TRIMESTERS', data: tri })
      dispatch({ type: 'SET_COURSES', data: courses })
      dispatch({ type: 'SET_EVENTS', data: events })
      dispatch({ type: 'SET_ATTENDANCE', data: att })
    } catch (e: any) {
      toast('Could not load data: ' + e.message)
    } finally {
      dispatch({ type: 'SET_LOADING', v: false })
    }
  }, [toast])

  // Restore from localStorage
  useEffect(() => {
    const p = localStorage.getItem('tmr_profile') as Profile | null
    const tri = localStorage.getItem('tmr_active_tri')
    const theme = localStorage.getItem('tmr_theme') as 'dark' | 'light' | null
    if (p) dispatch({ type: 'SET_PROFILE', profile: p })
    if (tri) dispatch({ type: 'SET_ACTIVE_TRI', id: tri })
    if (theme) dispatch({ type: 'SET_THEME', theme })
    else dispatch({ type: 'SET_THEME', theme: 'dark' })
  }, [])

  useEffect(() => {
    if (s.profile) load()
  }, [s.profile, load])

  useEffect(() => {
    document.documentElement.dataset.profile = s.profile || ''
    document.documentElement.dataset.theme = s.theme
  }, [s.profile, s.theme])

  const setProfile = (p: Profile) => {
    localStorage.setItem('tmr_profile', p)
    dispatch({ type: 'SET_PROFILE', profile: p })
  }
  const setActiveTri = (id: string | null) => {
    if (id) localStorage.setItem('tmr_active_tri', id)
    else localStorage.removeItem('tmr_active_tri')
    dispatch({ type: 'SET_ACTIVE_TRI', id })
  }
  const setTheme = (t: 'dark' | 'light') => {
    localStorage.setItem('tmr_theme', t)
    dispatch({ type: 'SET_THEME', theme: t })
  }

  // ── Events ────────────────────────────────────────────────────────────────
  const now = new Date().toISOString()
  const makeOptEv = (e: Omit<Ev, 'id' | 'created_at' | 'updated_at'>): Ev =>
    ({ ...e, id: crypto.randomUUID(), created_at: now, updated_at: now })

  const addEvent = async (e: Omit<Ev, 'id' | 'created_at' | 'updated_at'>) => {
    const opt = makeOptEv(e)
    dispatch({ type: 'OPT_ADD_EVENT', ev: opt })
    try {
      const real = await api.saveEvent(e)
      dispatch({ type: 'OPT_UPDATE_EVENT', ev: real })
    } catch (err: any) {
      dispatch({ type: 'OPT_REMOVE_EVENT', id: opt.id })
      toast('Event not saved: ' + err.message)
    }
  }

  const updateEvent = async (id: string, patch: Partial<Ev>) => {
    const prev = s.events.find(e => e.id === id)
    if (!prev) return
    dispatch({ type: 'OPT_UPDATE_EVENT', ev: { ...prev, ...patch } })
    try {
      const real = await api.updateEvent(id, patch)
      dispatch({ type: 'OPT_UPDATE_EVENT', ev: real })
    } catch (err: any) {
      dispatch({ type: 'OPT_UPDATE_EVENT', ev: prev })
      toast('Update failed: ' + err.message)
    }
  }

  const removeEvent = async (id: string) => {
    const prev = s.events.find(e => e.id === id)
    dispatch({ type: 'OPT_REMOVE_EVENT', id })
    try {
      await api.deleteEvent(id)
    } catch (err: any) {
      if (prev) dispatch({ type: 'OPT_ADD_EVENT', ev: prev })
      toast('Delete failed: ' + err.message)
    }
  }

  const addRecurringEvents = async (
    base: Omit<Ev, 'id'|'created_at'|'updated_at'|'date'|'recurring_group_id'>,
    start: string, days: number[], until: string
  ) => {
    try {
      const evs = await api.saveRecurringEvents(base, start, days, until)
      dispatch({ type: 'OPT_ADD_EVENTS', evs })
      toast(`Created ${evs.length} sessions`)
    } catch (err: any) { toast('Failed: ' + err.message) }
  }

  const rescheduleEvent = async (id: string, date: string, start: string, end: string, room: string) => {
    const orig = s.events.find(e => e.id === id)
    if (!orig) return
    try {
      const { cancelled, created } = await api.rescheduleEvent(id, date, start, end, room, orig)
      dispatch({ type: 'OPT_UPDATE_EVENT', ev: cancelled })
      dispatch({ type: 'OPT_ADD_EVENT', ev: created })
      toast('Event rescheduled')
    } catch (err: any) { toast('Reschedule failed: ' + err.message) }
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  const addCourse = async (c: Omit<Course, 'id' | 'created_at'>) => {
    const opt: Course = { ...c, id: crypto.randomUUID(), created_at: now }
    dispatch({ type: 'OPT_ADD_COURSE', course: opt })
    try {
      const real = await api.saveCourse(c)
      dispatch({ type: 'OPT_UPDATE_COURSE', course: real })
    } catch (err: any) {
      dispatch({ type: 'OPT_REMOVE_COURSE', id: opt.id })
      toast('Course not saved: ' + err.message)
    }
  }

  const updateCourse = async (id: string, patch: Partial<Course>) => {
    const prev = s.courses.find(c => c.id === id)
    if (!prev) return
    dispatch({ type: 'OPT_UPDATE_COURSE', course: { ...prev, ...patch } })
    try {
      const real = await api.updateCourse(id, patch)
      dispatch({ type: 'OPT_UPDATE_COURSE', course: real })
    } catch (err: any) {
      dispatch({ type: 'OPT_UPDATE_COURSE', course: prev })
      toast('Update failed: ' + err.message)
    }
  }

  const removeCourse = async (id: string) => {
    const prev = s.courses.find(c => c.id === id)
    dispatch({ type: 'OPT_REMOVE_COURSE', id })
    try {
      await api.deleteCourse(id)
    } catch (err: any) {
      if (prev) dispatch({ type: 'OPT_ADD_COURSE', course: prev })
      toast('Delete failed: ' + err.message)
    }
  }

  // ── Trimesters ────────────────────────────────────────────────────────────
  const addTrimester = async (t: Omit<Trimester, 'id' | 'created_at'>) => {
    const opt: Trimester = { ...t, id: crypto.randomUUID(), created_at: now }
    dispatch({ type: 'OPT_ADD_TRIMESTER', t: opt })
    try {
      const real = await api.createTrimester(t)
      dispatch({ type: 'OPT_REMOVE_TRIMESTER', id: opt.id })
      dispatch({ type: 'OPT_ADD_TRIMESTER', t: real })
    } catch (err: any) {
      dispatch({ type: 'OPT_REMOVE_TRIMESTER', id: opt.id })
      toast('Failed: ' + err.message)
    }
  }

  const removeTrimester = async (id: string) => {
    const prev = s.trimesters.find(t => t.id === id)
    dispatch({ type: 'OPT_REMOVE_TRIMESTER', id })
    try { await api.deleteTrimester(id) }
    catch (err: any) {
      if (prev) dispatch({ type: 'OPT_ADD_TRIMESTER', t: prev })
      toast('Delete failed: ' + err.message)
    }
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  const setAttendance = async (eventId: string, status: import('./types').AttendanceStatus, courseId: string | null, date: string) => {
    if (!s.profile) return
    const a: Attendance = { event_id: eventId, profile: s.profile, course_id: courseId, date, status, notes: '', updated_at: now }
    dispatch({ type: 'OPT_UPSERT_ATTENDANCE', a })
    try { await api.upsertAttendance(a) }
    catch (err: any) { toast('Attendance not saved: ' + err.message) }
  }

  return (
    <C.Provider value={{
      ...s, setProfile, setActiveTri, setTheme,
      addEvent, updateEvent, removeEvent, addRecurringEvents, rescheduleEvent,
      addCourse, updateCourse, removeCourse,
      addTrimester, removeTrimester,
      setAttendance, reload: load
    }}>
      {children}
      {s.toast && (
        <div key={s.toast.id} style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--s3)', color: 'var(--tx)', padding: '12px 20px',
          borderRadius: 8, zIndex: 9999, fontSize: 13, whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,.4)', animation: 'fadeup .15s ease-out'
        }}>
          {s.toast.msg}
        </div>
      )}
    </C.Provider>
  )
}
