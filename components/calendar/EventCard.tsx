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
  const course    = courses.find(c => c.id === ev.course_id)
  const color     = course?.color || '#6366f1'
  const title     = eventTitle(ev, courses, nums)
  const dashed    = isDashType(ev.type)
  const cancelled = ev.status === 'cancelled'
  const isAssignment = ASSIGNMENT_TYPES.includes(ev.type)

  const primaryLine   = course?.name || title
  const secondaryLine = course ? title : ''

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
      style={{ '--ev-c': color, containerType: 'size', ...style } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      {/* TALL card (≥72px): stacked layout — course name, session title, time+room */}
      <span className="ev-tall">
        <span className="ev-title" style={{ textDecoration: cancelled ? 'line-through' : undefined }}>
          {primaryLine}
        </span>
        {secondaryLine && <span className="ev-course">{secondaryLine}</span>}
        {meta && <span className="ev-meta">{meta}</span>}
      </span>

      {/* SHORT card (<72px): single inline line — name · time · room */}
      <span className="ev-short">
        <span style={{
          fontWeight: 700, fontSize: 11,
          textDecoration: cancelled ? 'line-through' : undefined,
        }}>
          {primaryLine}
        </span>
        {meta && (
          <span style={{ fontSize: 10, color: 'var(--tx2)', marginLeft: 5 }}>
            {meta}
          </span>
        )}
        {secondaryLine && (
          <span style={{ fontSize: 10, color: 'var(--tx3)', marginLeft: 5 }}>
            {secondaryLine}
          </span>
        )}
      </span>
    </div>
  )
}
