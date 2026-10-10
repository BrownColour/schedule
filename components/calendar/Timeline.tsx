'use client'
import { useMemo, useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/state'
import { EventCard } from './EventCard'
import { sessionNumbers, timeToMins, ymd, hhmm } from '@/lib/utils'
import type { Ev } from '@/lib/types'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7) // 7am–10pm
const HOUR_H = 60 // px per hour

function fmt12(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ampm}`
}

interface Props {
  dates: string[]
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
    setTimeout(() => nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }, [])

  const todayStr = ymd(now)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const nowTop = (nowMins - 420) * (HOUR_H / 60)

  const totalH = HOUR_H * HOURS.length
  const isWeek = dates.length > 1

  return (
    <div style={{ overflowX: isWeek ? 'auto' : undefined }}>
      <div style={{ display: 'flex', minWidth: isWeek ? 560 : undefined }}>

        {/* Hour labels column */}
        <div style={{ width: 44, flexShrink: 0, position: 'relative' }}>
          {/* Spacer for day header row */}
          {isWeek && <div style={{ height: 40 }} />}
          {HOURS.map(h => (
            <div key={h} style={{
              height: HOUR_H,
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 8, paddingTop: 0,
              fontSize: 10, color: 'var(--tx3)',
              position: 'relative', top: -7,
            }}>
              {fmt12(h)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {dates.map(d => {
          const dayEvs = events.filter(e =>
            e.profile === profile && e.date === d && e.start_time
          )
          const isToday = d === todayStr
          const dt = new Date(d + 'T00:00:00')

          return (
            <div key={d} style={{ flex: 1, minWidth: 0, position: 'relative' }}>

              {/* Day header (week view only) */}
              {isWeek && (
                <div style={{
                  height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  color: isToday ? 'var(--ac)' : 'var(--tx2)',
                  borderBottom: '1px solid var(--sep)',
                  gap: 4,
                }}>
                  <span>{dt.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span style={{
                    fontWeight: isToday ? 800 : 600,
                    background: isToday ? 'var(--ac)' : 'transparent',
                    color: isToday ? 'var(--bg)' : undefined,
                    borderRadius: '50%',
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {dt.getDate()}
                  </span>
                </div>
              )}

              {/* Hour grid cells */}
              <div style={{ position: 'relative', height: totalH }}>
                {HOURS.map((h, idx) => (
                  <div key={h} style={{
                    position: 'absolute',
                    top: idx * HOUR_H,
                    left: 0, right: 0,
                    height: HOUR_H,
                    borderTop: '1px solid var(--sep)',
                    background: idx % 2 === 1 ? 'rgba(255,255,255,.012)' : undefined,
                  }} />
                ))}

                {/* Events */}
                {dayEvs.map(e => {
                  const start = timeToMins(e.start_time)
                  const end = timeToMins(e.end_time) || start + 80
                  const top = Math.max(0, (start - 420)) * (HOUR_H / 60)
                  const height = Math.max(44, (end - start) * (HOUR_H / 60))
                  return (
                    <div key={e.id} style={{
                      position: 'absolute',
                      top,
                      height,
                      left: 2,
                      right: 2,
                      zIndex: 2,
                    }}>
                      <EventCard
                        ev={e}
                        courses={courses}
                        nums={nums}
                        onClick={() => onEventClick(e)}
                        style={{ height: '100%', overflow: 'hidden' }}
                      />
                    </div>
                  )
                })}

                {/* Now line (only on today's column) */}
                {isToday && nowMins >= 420 && nowMins < 1020 && (
                  <div
                    ref={nowRef}
                    style={{
                      position: 'absolute',
                      top: nowTop,
                      left: 0, right: 0,
                      height: 2,
                      background: 'var(--ac)',
                      zIndex: 5,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: -4, top: -4,
                      width: 10, height: 10,
                      borderRadius: '50%',
                      background: 'var(--ac)',
                    }} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
