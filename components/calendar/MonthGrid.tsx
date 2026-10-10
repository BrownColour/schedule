'use client'
import { useMemo } from 'react'
import { useApp } from '@/lib/state'
import { getMonthDays, ymd, eventTitle, sessionNumbers } from '@/lib/utils'
import type { Ev } from '@/lib/types'

const DOWS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

interface Props {
  year: number
  month: number   // 0-indexed
  onDayClick: (date: string) => void
  onEventClick: (ev: Ev) => void
}

export function MonthGrid({ year, month, onDayClick, onEventClick }: Props) {
  const { profile, events, courses } = useApp()
  const nums = useMemo(() => sessionNumbers(events), [events])
  const todayStr = ymd(new Date())
  const days = getMonthDays(year, month)

  const byDate = useMemo(() => {
    const map: Record<string, Ev[]> = {}
    events.filter(e => e.profile === profile).forEach(e => {
      map[e.date] = [...(map[e.date] || []), e]
    })
    return map
  }, [events, profile])

  return (
    <div className="month-grid">
      {DOWS.map(d => <div key={d} className="month-dow">{d}</div>)}
      {days.map((d, i) => {
        if (!d) return <div key={i} style={{ background: 'var(--s2)' }} />
        const k = ymd(d)
        const dayEvs = (byDate[k] || []).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        const isToday = k === todayStr
        const isOtherMonth = d.getMonth() !== month
        return (
          <div key={k} className={`month-cell ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}`} onClick={() => onDayClick(k)}>
            <div className="month-day">{d.getDate()}</div>
            {dayEvs.slice(0, 3).map(e => {
              const c = courses.find(x => x.id === e.course_id)
              const color = c?.color || '#6366f1'
              return (
                <div key={e.id} className="month-ev" style={{ '--ev-c': color } as React.CSSProperties}
                  onClick={ev => { ev.stopPropagation(); onEventClick(e) }}>
                  {eventTitle(e, courses, nums)}
                </div>
              )
            })}
            {dayEvs.length > 3 && <div className="month-more">+{dayEvs.length - 3} more</div>}
          </div>
        )
      })}
    </div>
  )
}
