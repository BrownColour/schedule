'use client'
import { useMemo, useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/state'
import { EventCard } from './EventCard'
import { sessionNumbers, timeToMins, ymd } from '@/lib/utils'
import type { Ev } from '@/lib/types'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7)
const HOUR_H = 60

function fmt12(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ampm}`
}

// Compute non-overlapping columns for a set of events in one day
function layoutEvents(evs: Ev[]): { ev: Ev; col: number; cols: number }[] {
  if (!evs.length) return []
  const sorted = [...evs].sort((a, b) => timeToMins(a.start_time) - timeToMins(b.start_time))
  const columns: number[] = [] // tracks end time of last event in each column

  const placed: { ev: Ev; col: number }[] = sorted.map(ev => {
    const start = timeToMins(ev.start_time)
    const end = ev.end_time ? timeToMins(ev.end_time) : start + 80
    // Find first column where the last event ended before this one starts
    let col = columns.findIndex(colEnd => colEnd <= start)
    if (col === -1) { col = columns.length; columns.push(end) }
    else columns[col] = end
    return { ev, col }
  })

  const totalCols = columns.length
  return placed.map(p => ({ ...p, cols: totalCols }))
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

        {/* Hour labels */}
        <div style={{ width: 44, flexShrink: 0 }}>
          {isWeek && <div style={{ height: 40 }} />}
          {HOURS.map(h => (
            <div key={h} style={{
              height: HOUR_H, display: 'flex', alignItems: 'flex-start',
              justifyContent: 'flex-end', paddingRight: 8,
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
          const laid = layoutEvents(dayEvs)
          const isToday = d === todayStr
          const dt = new Date(d + 'T00:00:00')

          return (
            <div key={d} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              {isWeek && (
                <div style={{
                  height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  color: isToday ? 'var(--ac)' : 'var(--tx2)',
                  borderBottom: '1px solid var(--sep)', gap: 4,
                }}>
                  <span>{dt.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span style={{
                    fontWeight: isToday ? 800 : 600,
                    background: isToday ? 'var(--ac)' : 'transparent',
                    color: isToday ? 'var(--bg)' : undefined,
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {dt.getDate()}
                  </span>
                </div>
              )}

              <div style={{ position: 'relative', height: totalH }}>
                {/* Hour lines */}
                {HOURS.map((_, idx) => (
                  <div key={idx} style={{
                    position: 'absolute', top: idx * HOUR_H, left: 0, right: 0, height: HOUR_H,
                    borderTop: '1px solid var(--sep)',
                    background: idx % 2 === 1 ? 'rgba(255,255,255,.012)' : undefined,
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* Events — laid out side by side when overlapping */}
                {laid.map(({ ev, col, cols }) => {
                  const start = timeToMins(ev.start_time)
                  const end = ev.end_time ? timeToMins(ev.end_time) : start + 80
                  const top = Math.max(0, (start - 420)) * (HOUR_H / 60)
                  const height = Math.max(44, (end - start) * (HOUR_H / 60))
                  const pct = 100 / cols
                  return (
                    <div key={ev.id} style={{
                      position: 'absolute',
                      top, height,
                      left: `calc(${col * pct}% + 2px)`,
                      width: `calc(${pct}% - 4px)`,
                      zIndex: 2,
                    }}>
                      <EventCard ev={ev} courses={courses} nums={nums}
                        onClick={() => onEventClick(ev)}
                        style={{ height: '100%', overflow: 'hidden' }} />
                    </div>
                  )
                })}

                {/* Now line */}
                {isToday && nowMins >= 420 && nowMins < 1020 && (
                  <div ref={nowRef} style={{
                    position: 'absolute', top: nowTop, left: 0, right: 0,
                    height: 2, background: 'var(--ac)', zIndex: 5, pointerEvents: 'none',
                  }}>
                    <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--ac)' }} />
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
