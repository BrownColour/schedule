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
  description: string
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
