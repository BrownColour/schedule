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
      style={{ '--ev-c': color, ...style } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      {/*
        Always show all info regardless of card height.
        Use a single flex-wrap row so content compresses horizontally
        before it ever gets clipped vertically.
      */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: '0 6px',
        overflow: 'hidden',
      }}>
        {/* Course name — bold */}
        <span style={{
          fontWeight: 700,
          fontSize: 11,
          lineHeight: 1.3,
          textDecoration: cancelled ? 'line-through' : undefined,
          flexShrink: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {primaryLine}
        </span>

        {/* Time + room — always shown, wraps next to name if space allows */}
        {meta && (
          <span style={{
            fontSize: 10,
            color: 'var(--tx2)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {meta}
          </span>
        )}

        {/* Session number / title — muted, wraps last */}
        {secondaryLine && (
          <span style={{
            fontSize: 10,
            color: 'var(--tx3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 1,
            minWidth: 0,
          }}>
            {secondaryLine}
          </span>
        )}
      </div>
    </div>
  )
}
