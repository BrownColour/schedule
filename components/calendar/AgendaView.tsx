'use client'
import { useMemo } from 'react'
import { useApp } from '@/lib/state'
import { sessionNumbers, getWeekGroups, eventTitle, hhmm, formatDateDisplay } from '@/lib/utils'
import type { Ev } from '@/lib/types'

interface Props { onEventClick: (ev: Ev) => void }

export function AgendaView({ onEventClick }: Props) {
  const { profile, events, courses, activeTriId } = useApp()
  const nums = useMemo(() => sessionNumbers(events), [events])

  const filtered = useMemo(() =>
    events.filter(e => e.profile === profile && (!activeTriId || e.trimester_id === activeTriId))
      .sort((a, b) => (a.date + (a.start_time || '')).localeCompare(b.date + (b.start_time || ''))),
    [events, profile, activeTriId])

  const weeks = getWeekGroups(filtered)
  if (!weeks.length) return <div className="empty"><h3>No events</h3><p>Add events to see them here.</p></div>

  return (
    <div>
      {weeks.map(w => (
        <div key={w.weekLabel}>
          <div className="week-label">{w.weekLabel}</div>
          {w.days.map(({ date, evs }) => (
            <div key={date} className="agenda-day">
              <div className="agenda-date">{formatDateDisplay(date, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              {evs.map(e => {
                const c = courses.find(x => x.id === e.course_id)
                return (
                  <div key={e.id} className="agenda-ev" onClick={() => onEventClick(e)} style={{ cursor: 'pointer', borderLeft: `3px solid ${c?.color || '#6366f1'}`, paddingLeft: 10 }}>
                    <div className="agenda-time">{hhmm(e.start_time) || 'All day'}</div>
                    <div className="agenda-body">
                      <div className="agenda-title" style={{ textDecoration: e.status === 'cancelled' ? 'line-through' : undefined }}>{eventTitle(e, courses, nums)}</div>
                      <div className="agenda-sub">{c?.name}{e.room ? ` · ${e.room}` : ''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
