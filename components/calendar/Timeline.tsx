'use client'
import { useMemo, useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/state'
import { EventCard } from './EventCard'
import { sessionNumbers, timeToMins, ymd } from '@/lib/utils'
import type { Ev } from '@/lib/types'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7) // 7am–10pm
const PX_PER_MIN = 1           // 60px per hour
const HOUR_H = 60

interface Props {
  dates: string[]           // one date = day view; 7 dates = week view
  onEventClick: (ev: Ev) => void
}

export function Timeline({ dates, onEventClick }: Props) {
  const { profile, events, courses } = useApp()
  const nums = useMemo(() => sessionNumbers(events), [events])
  const [now, setNow] = useState(new Date())
  const nowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const todayStr = ymd(now)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const nowTop = (nowMins - 420) * PX_PER_MIN

  // Events for these dates, current profile only
  const dateEvs = dates.map(d => events.filter(e => e.profile === profile && e.date === d && e.start_time))

  const totalH = HOUR_H * HOURS.length

  return (
    <div className="timeline-wrap" style={{ overflowY: 'auto', maxHeight: '72vh', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${dates.length}, 1fr)` }}>
        {/* Day headers for week view */}
        {dates.length > 1 && (
          <>
            <div />
            {dates.map(d => {
              const dt = new Date(d + 'T00:00:00')
              const isToday = d === todayStr
              return (
                <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 600, color: isToday ? 'var(--ac)' : 'var(--tx2)', borderBottom: '1px solid var(--sep)' }}>
                  {dt.toLocaleDateString(undefined, { weekday: 'short' })}<br />
                  <span style={{ fontWeight: isToday ? 800 : 600 }}>{dt.getDate()}</span>
                </div>
              )
            })}
          </>
        )}

        {/* Hour grid */}
        {HOURS.map((h, idx) => (
          <>
            <div key={`lbl-${h}`} className="tl-hour-label">{h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`}</div>
            {dates.map(d => (
              <div key={`cell-${d}-${h}`} className={`tl-hour-cell ${idx % 2 === 1 ? 'alt' : ''}`} style={{ position: 'relative' }}>
                {/* Events positioned absolutely within their column */}
              </div>
            ))}
          </>
        ))}

        {/* Events layer */}
        {dates.map((d, di) => {
          const evs = dateEvs[di]
          return evs.map(e => {
            const start = timeToMins(e.start_time)
            const end   = timeToMins(e.end_time) || start + 80
            const top  = Math.max(0, (start - 420)) * PX_PER_MIN
            const height = Math.max(44, (end - start) * PX_PER_MIN)
            return (
              <div key={e.id} style={{
                position: 'absolute',
                gridColumn: `${di + 2}`,
                top,
                height,
                left: 2, right: 2,
                zIndex: 2,
              }}>
                <EventCard ev={e} courses={courses} nums={nums} onClick={() => onEventClick(e)} style={{ height: '100%' }} />
              </div>
            )
          })
        })}
      </div>

      {/* Now line */}
      {dates.includes(todayStr) && nowMins >= 420 && nowMins < 1320 && (
        <div
          ref={nowRef}
          className="now-line"
          style={{
            position: 'absolute',
            top: (dates.length > 1 ? 40 : 0) + nowTop,
            left: 44, right: 0,
          }}
        >
          <div className="now-dot" />
        </div>
      )}
    </div>
  )
}
