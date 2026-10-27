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

export function EventCard({ ev, courses, nums, onClick, style, className = '' }: Props) {
  const course   = courses.find(c => c.id === ev.course_id)
  const color    = course?.color || '#6366f1'
  const title    = eventTitle(ev, courses, nums)
  const dashed   = isDashType(ev.type)
  const cancelled = ev.status === 'cancelled'
  const isAssignment = ASSIGNMENT_TYPES.includes(ev.type)

  // Course name is the highlighted first line; session number / title is secondary
  const primaryLine   = course?.name || title
  const secondaryLine = course ? title : ''

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

  return (
    <div
      className={`ev-card ${dashed ? 'dashed' : ''} ${cancelled ? 'cancelled' : ''} ${className}`}
      style={{ '--ev-c': color, ...style } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Course name — bold, highlighted */}
      <span className="ev-title">{primaryLine}</span>
      {/* Session number / event title — muted */}
      {secondaryLine && <span className="ev-course">{secondaryLine}</span>}
      {/* Time */}
      {timeStr && <span className="ev-meta">{timeStr}{!isAssignment && ev.room ? ` · ${ev.room}` : ''}</span>}
    </div>
  )
}
