'use client'
import { useMemo } from 'react'
import { useApp } from '@/lib/state'
import { EventCard } from './EventCard'
import { hhmm, sessionNumbers, formatDateFull, timeToMins } from '@/lib/utils'
import type { Ev } from '@/lib/types'

interface Props {
  date: string
  now: Date
  onEventClick: (ev: Ev) => void
}

function minsToLabel(h: number): string {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ampm}`
}

export function CompareTable({ date, now, onEventClick }: Props) {
  const { profile, events, courses } = useApp()
  const other = profile === 'S' ? 'K' : 'S'
  const nums = useMemo(() => sessionNumbers(events), [events])

  const mine   = events.filter(e => e.profile === profile && e.date === date)
  const theirs = events.filter(e => e.profile === other   && e.date === date)
  const all    = [...mine, ...theirs]

  // Dynamic hour range: earliest session start to latest session end, min 8am–6pm
  const timedEvs = all.filter(e => e.start_time)
  const startHour = timedEvs.length
    ? Math.min(8, ...timedEvs.map(e => Math.floor(timeToMins(e.start_time) / 60)))
    : 8
  const endHour = timedEvs.length
    ? Math.max(18, ...timedEvs.map(e => {
        const endMins = e.end_time
          ? timeToMins(e.end_time)
          : timeToMins(e.start_time) + 80
        return Math.ceil(endMins / 60)
      }))
    : 18
  const HOURS = Array.from({ length: endHour - startHour }, (_, i) => i + startHour)
  const totalMins = (endHour - startHour) * 60

  const inHour = (list: Ev[], h: number) => list.filter(e => e.start_time && parseInt(e.start_time) === h)
  const noTime = (list: Ev[]) => list.filter(e => !e.start_time)

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const showLine = date === todayStr && nowMins >= startHour * 60 && nowMins < endHour * 60
  const lineTop = `${((nowMins - startHour * 60) / totalMins) * 100}%`

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 10, fontSize: 14, color: 'var(--tx2)', fontWeight: 600 }}>
        {formatDateFull(date)}
      </h2>
      <div className="cmp-grid" style={{ position: 'relative' }}>
        {/* Headers */}
        <div />
        <div className={`cmp-head ${profile === 'S' ? 's' : 'k'}`}>{profile}</div>
        <div className={`cmp-head ${other === 'S' ? 's' : 'k'}`}>{other}</div>

        {/* No-time row */}
        <div className="cmp-no-time">–</div>
        <div className={`cmp-cell ${profile === 'S' ? 'cmp-col-s' : 'cmp-col-k'}`}>
          {noTime(mine).map(e => <EventCard key={e.id} ev={e} courses={courses} nums={nums} onClick={() => onEventClick(e)} />)}
        </div>
        <div className={`cmp-cell ${other === 'S' ? 'cmp-col-s' : 'cmp-col-k'}`}>
          {noTime(theirs).map(e => <EventCard key={e.id} ev={e} courses={courses} nums={nums} onClick={() => onEventClick(e)} />)}
        </div>

        {/* Hour rows */}
        {HOURS.map((h, idx) => {
          const alt = idx % 2 === 1
          return [
            <div key={`lbl-${h}`} className={`cmp-time ${alt ? 'alt-row' : ''}`} style={{ paddingTop: 6 }}>{minsToLabel(h)}</div>,
            <div key={`me-${h}`} className={`cmp-cell ${alt ? 'alt-row' : ''} ${profile === 'S' ? 'cmp-col-s' : 'cmp-col-k'}`}>
              {inHour(mine, h).map(e => <EventCard key={e.id} ev={e} courses={courses} nums={nums} onClick={() => onEventClick(e)} />)}
            </div>,
            <div key={`th-${h}`} className={`cmp-cell ${alt ? 'alt-row' : ''} ${other === 'S' ? 'cmp-col-s' : 'cmp-col-k'}`}>
              {inHour(theirs, h).map(e => <EventCard key={e.id} ev={e} courses={courses} nums={nums} onClick={() => onEventClick(e)} />)}
            </div>,
          ]
        })}

        {/* Now line */}
        {showLine && (
          <div className="now-line" style={{ top: lineTop, left: 0, gridColumn: '1 / -1', position: 'absolute' }}>
            <div className="now-dot" />
          </div>
        )}
      </div>
    </div>
  )
}
