export type Profile = 'S' | 'K'

export type CreditType = 'half' | 'full'
export type EventType =
  | 'session'
  | 'test'
  | 'individual_assignment'
  | 'individual_project'
  | 'group_assignment'
  | 'group_project'
  | 'exam'
  | 'extracurricular'
  | 'other'
export type EventStatus = 'scheduled' | 'cancelled'
export type AttendanceStatus = 'present' | 'absent'

export interface Trimester {
  id: string
  profile: Profile
  name: string
  start_date: string
  end_date: string | null
  created_at: string
}

export interface Course {
  id: string
  profile: Profile
  trimester_id: string | null
  name: string
  code: string
  professor: string
  credit_type: CreditType
  min_sessions: number
  color: string
  notes: string
  created_at: string
}

export interface Ev {
  id: string
  profile: Profile
  trimester_id: string | null
  course_id: string | null
  type: EventType
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  room: string
  status: EventStatus
  recurring_group_id: string
  linked_to: string | null
  description: string   // may contain encoded extras, use parseEvExtras()
  created_at: string
  updated_at: string
}

export interface Attendance {
  event_id: string
  profile: Profile
  course_id: string | null
  date: string | null
  status: AttendanceStatus
  notes: string
  updated_at: string
}

export type Tab = 'today' | 'calendar' | 'courses' | 'attendance' | 'settings'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  session: 'Session',
  test: 'Test',
  individual_assignment: 'Individual Assignment',
  individual_project: 'Individual Project',
  group_assignment: 'Group Assignment',
  group_project: 'Group Project',
  exam: 'Exam',
  extracurricular: 'Extracurricular',
  other: 'Other',
}

export const EVENT_TYPES: EventType[] = [
  'session','test','individual_assignment','individual_project',
  'group_assignment','group_project','exam','extracurricular','other',
]

export const ASSIGNMENT_TYPES: EventType[] = [
  'individual_assignment','individual_project','group_assignment','group_project',
]

// Extra fields stored encoded inside description:
// "__EXT__deadline_date=...|deadline_time=...|submission_mode=...|notes=..."
export interface EvExtras {
  deadline_date: string
  deadline_time: string
  submission_mode: string
  notes: string
}

const EXT_PREFIX = '__EXT__'

export function encodeEvExtras(extras: EvExtras, notes: string): string {
  return `${EXT_PREFIX}deadline_date=${extras.deadline_date}|deadline_time=${extras.deadline_time}|submission_mode=${extras.submission_mode}|notes=${notes}`
}

export function parseEvExtras(description: string): { extras: EvExtras; notes: string } {
  if (!description.startsWith(EXT_PREFIX)) {
    return { extras: { deadline_date: '', deadline_time: '', submission_mode: '', notes: '' }, notes: description }
  }
  const raw = description.slice(EXT_PREFIX.length)
  const parts: Record<string, string> = {}
  raw.split('|').forEach(seg => {
    const idx = seg.indexOf('=')
    if (idx > -1) parts[seg.slice(0, idx)] = seg.slice(idx + 1)
  })
  return {
    extras: {
      deadline_date: parts.deadline_date || '',
      deadline_time: parts.deadline_time || '',
      submission_mode: parts.submission_mode || '',
      notes: parts.notes || '',
    },
    notes: parts.notes || '',
  }
}
