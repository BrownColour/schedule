import type { Ev, Course } from '@/lib/types'
import { hhmm, eventTitle, isDashType } from '@/lib/utils'
import { parseEvExtras, ASSIGNMENT_TYPES } from '@/lib/types'

interface Props {
  ev: Ev
  courses: Course[]
  nums: Record<string, number>
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

// Counter per course per type, computed from all events passed in context
// We use a module-level WeakMap so it's stable per render cycle
const TYPE_LABELS: Record<string, string> = {
  test: 'Quiz',
  exam: 'Exam',
  individual_assignment: 'Assignment',
  individual_project: 'Project',
  group_assignment: 'Group Assignment',
  group_project: 'Group Project',
}

export function EventCard({ ev, courses, nums, onClick, style, className = '' }: Props) {
  const course    = courses.find(c => c.id === ev.course_id)
  const color     = course?.color || '#6366f1'
  const dashed    = isDashType(ev.type)
  const cancelled = ev.status === 'cancelled'
  const isAssignment = ASSIGNMENT_TYPES.includes(ev.type)
  const isTestType = ev.type === 'test' || ev.type === 'exam'

  // Build primary line
  // For tests/exams: "Quiz 1" or custom title
  // For sessions: "Session N" (from nums) or custom title
  // For others: custom title or type label
  let primaryLine = ''
  if (ev.title) {
    primaryLine = ev.title
  } else if (isTestType) {
    const typeLabel = TYPE_LABELS[ev.type] || ev.type
    // Use session-number-style counter stored in nums (keyed by ev.id)
    const n = nums[ev.id]
    primaryLine = n ? `${typeLabel} ${n}` : typeLabel
  } else {
    primaryLine = eventTitle(ev, courses, nums)
  }

  // Course name is the highlighted secondary line
  const courseLine = course?.name || ''

  // Time string
  let timeStr = ''
  if (isAssignment) {
    const { extras } = parseEvExtras(ev.description)
    timeStr = extras.deadline_date
      ? `Due ${extras.deadline_time ? hhmm(extras.deadline_time) : 'EOD'}`
      : ev.start_time ? `${hhmm(ev.start_time)}–${hhmm(ev.end_time) || ''}` : ''
  } else {
    timeStr = ev.start_time ? `${hhmm(ev.start_time)}–${hhmm(ev.end_time) || ''}` : ''
  }

  const meta = [timeStr, !isAssignment && ev.room ? ev.room : ''].filter(Boolean).join(' · ')

  return (
    <div
      className={`ev-card ${dashed ? 'dashed' : ''} ${cancelled ? 'cancelled' : ''} ${className}`}
      style={{ '--ev-c': color, ...style } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Primary: session/quiz number or title — bold */}
      <span className="ev-title" style={{ textDecoration: cancelled ? 'line-through' : undefined }}>
        {primaryLine}
      </span>
      {/* Secondary: course name — highlighted */}
      {courseLine && <span className="ev-meta" style={{ color: color, fontWeight: 600 }}>{courseLine}</span>}
      {/* Time + room */}
      {meta && <span className="ev-meta">{meta}</span>}
    </div>
  )
}
