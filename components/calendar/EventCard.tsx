import type { Ev, Course } from '@/lib/types'
import { hhmm, eventTitle, isDashType, sessionNumbers } from '@/lib/utils'

interface Props {
  ev: Ev
  courses: Course[]
  nums: Record<string, number>
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

export function EventCard({ ev, courses, nums, onClick, style, className = '' }: Props) {
  const course = courses.find(c => c.id === ev.course_id)
  const color = course?.color || '#6366f1'
  const title = eventTitle(ev, courses, nums)
  const dashed = isDashType(ev.type)
  const cancelled = ev.status === 'cancelled'
  const timeStr = ev.start_time ? `${hhmm(ev.start_time)}–${hhmm(ev.end_time) || ''}` : ''

  return (
    <div
      className={`ev-card ${dashed ? 'dashed' : ''} ${cancelled ? 'cancelled' : ''} ${className}`}
      style={{ '--ev-c': color, ...style } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <span className="ev-title">{title}</span>
      {timeStr && <span className="ev-meta">{timeStr}{ev.room ? ` · ${ev.room}` : ''}</span>}
      {course && <span className="ev-course">{course.name}</span>}
    </div>
  )
}
