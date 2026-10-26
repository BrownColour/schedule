'use client'
import { useMemo } from 'react'
import { useApp } from '@/lib/state'
import { EventCard } from './EventCard'
import { sessionNumbers, formatDateFull, timeToMins, hhmm, defaultEnd } from '@/lib/utils'
import type { Ev } from '@/lib/types'

const PX_PER_MIN = 1  // 60px per hour

function fmt12(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ampm}`
}

interface Props {
  date: string
  now: Date
  onEventClick: (ev: Ev) => void
}

export function CompareTable({ date, now, onEventClick }: Props) {
  const { profile, events, courses } = useApp()
  const other = profile === 'S' ? 'K' : 'S'
  const nums = useMemo(() => sessionNumbers(events), [events])

  const mine   = events.filter(e => e.profile === profile && e.date === date)
  const theirs = events.filter(e => e.profile === other   && e.date === date)
  const all    = [...mine, ...theirs]

  // Dynamic hour range: earliest start to latest end across BOTH users, no cap
  const timedEvs = all.filter(e => e.start_time)

  const startHour = timedEvs.length
    ? Math.floor(Math.min(...timedEvs.map(e => timeToMins(e.start_time) / 60)))
    : 8

  const endHour = timedEvs.length
    ? Math.ceil(Math.max(...timedEvs.map(e => {
        const endMins = e.end_time
          ? timeToMins(e.end_time)
          : timeToMins(e.start_time) + 80
        return endMins / 60
      })))
    : 18

  // Clamp to reasonable bounds but don't cut events
  const clampedStart = Math.max(6, Math.min(startHour, 8))
  const clampedEnd   = Math.max(endHour, clampedStart + 2) // always show at least 2 hrs

  const HOURS = Array.from({ length: clampedEnd - clampedStart }, (_, i) => i + clampedStart)
  const startMins = clampedStart * 60
  const totalH = HOURS.length * 60

  const topFor = (e: Ev) => Math.max(0, (timeToMins(e.start_time) - startMins)) * PX_PER_MIN
  const heightFor = (e: Ev) => {
    const s = timeToMins(e.start_time)
    const en = e.end_time ? timeToMins(e.end_time) : s + 80
    return Math.max(44, (en - s) * PX_PER_MIN)
  }

  const noTime = (list: Ev[]) => list.filter(e => !e.start_time)
  const timed  = (list: Ev[]) => list.filter(e => !!e.start_time)

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  const showLine = date === todayStr && nowMins >= startMins && nowMins < clampedEnd * 60
  const nowTop   = (nowMins - startMins) * PX_PER_MIN

  const dayStart = (list: Ev[]) => {
    const t = list.filter(e => e.start_time).sort((a, b) => (a.start_time||'').localeCompare(b.start_time||''))
    return t.length ? hhmm(t[0].start_time) : null
  }
  const dayEnd = (list: Ev[]) => {
    const t = list.filter(e => e.start_time).sort((a, b) => {
      const ae = a.end_time ? timeToMins(a.end_time) : timeToMins(a.start_time) + 80
      const be = b.end_time ? timeToMins(b.end_time) : timeToMins(b.start_time) + 80
      return be - ae
    })
    if (!t.length) return null
    const e = t[0]
    return hhmm(e.end_time || defaultEnd(e.start_time!))
  }

  const ColBg  = (p: string) => p === 'S' ? 'cmp-col-s' : 'cmp-col-k'
  const HeadCl = (p: string) => p === 'S' ? 's' : 'k'

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 10, fontSize: 14, color: 'var(--tx2)', fontWeight: 600 }}>
        {formatDateFull(date)}
      </h2>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr', background: 'var(--s2)', borderRadius: '10px 10px 0 0', borderBottom: '1px solid var(--sep)' }}>
        <div />
        {([profile, other] as string[]).map(p => {
          const list = p === profile ? mine : theirs
          const s = dayStart(list)
          const e = dayEnd(list)
          return (
            <div key={p} className={`cmp-head ${HeadCl(p)}`} style={{ padding: '10px 8px' }}>
              <div style={{ fontWeight: 700 }}>{p}</div>
              {s && e
                ? <div style={{ fontSize: 10, fontWeight: 400, opacity: .7, marginTop: 2 }}>{s} – {e}</div>
                : <div style={{ fontSize: 10, opacity: .4, marginTop: 2 }}>No events</div>
              }
            </div>
          )
        })}
      </div>

      {/* No-time row */}
      {(noTime(mine).length > 0 || noTime(theirs).length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr', background: 'var(--s2)', borderBottom: '1px solid var(--sep)' }}>
          <div style={{ fontSize: 10, color: 'var(--tx3)', padding: '4px 4px 4px 6px', display: 'flex', alignItems: 'center' }}>–</div>
          {([mine, theirs] as Ev[][]).map((list, i) => {
            const p = i === 0 ? profile! : other
            return (
              <div key={p} className={ColBg(p)} style={{ padding: 4 }}>
                {noTime(list).map(e => <EventCard key={e.id} ev={e} courses={courses} nums={nums} onClick={() => onEventClick(e)} />)}
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline */}
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr 1fr',
        background: 'var(--s2)', borderRadius: '0 0 10px 10px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Hour labels */}
        <div style={{ position: 'relative', height: totalH }}>
          {HOURS.map((h, idx) => (
            <div key={h} style={{
              position: 'absolute', top: idx * 60,
              right: 6, fontSize: 10, color: 'var(--tx3)',
              lineHeight: 1, paddingTop: 3,
            }}>{fmt12(h)}</div>
          ))}
        </div>

        {/* Event columns */}
        {([mine, theirs] as Ev[][]).map((list, i) => {
          const p = i === 0 ? profile! : other
          return (
            <div key={p} className={ColBg(p)} style={{ position: 'relative', height: totalH, borderLeft: '1px solid var(--sep)' }}>
              {/* Hour lines */}
              {HOURS.map((_, idx) => (
                <div key={idx} style={{
                  position: 'absolute', top: idx * 60, left: 0, right: 0, height: 60,
                  borderTop: '1px solid var(--sep)',
                  background: idx % 2 === 1 ? 'rgba(255,255,255,.012)' : undefined,
                  pointerEvents: 'none',
                }} />
              ))}
              {/* Events */}
              {timed(list).map(e => (
                <div key={e.id} style={{
                  position: 'absolute',
                  top: topFor(e),
                  height: heightFor(e),
                  left: 3, right: 3, zIndex: 2,
                }}>
                  <EventCard ev={e} courses={courses} nums={nums}
                    onClick={() => onEventClick(e)}
                    style={{ height: '100%', overflow: 'hidden' }} />
                </div>
              ))}
            </div>
          )
        })}

        {/* Now line */}
        {showLine && (
          <div style={{
            position: 'absolute', top: nowTop, left: 44, right: 0,
            height: 2, background: 'var(--ac)', zIndex: 5, pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--ac)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
