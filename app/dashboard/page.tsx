'use client'
import { useState, useEffect, useMemo } from 'react'
import { Shell } from '@/components/layout/Shell'
import { CompareTable } from '@/components/calendar/CompareTable'
import { EventModal } from '@/components/calendar/EventModal'
import { useApp } from '@/lib/state'
import { ymd, addDays, sessionNumbers, eventTitle, hhmm, formatDateDisplay, timeToMins } from '@/lib/utils'
import type { Ev, Profile } from '@/lib/types'

const PX_PER_MIN = 0.7

function fmt12(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ampm}`
}

function WeekDayTimeline({ date, evs, profile, other, courses, nums, onEventClick }: {
  date: string; evs: Ev[]; profile: Profile; other: Profile
  courses: import('@/lib/types').Course[]; nums: Record<string, number>
  onEventClick: (e: Ev) => void
}) {
  const timed  = evs.filter(e => e.start_time)
  const noTime = evs.filter(e => !e.start_time)
  if (!timed.length && !noTime.length) return null

  const startMins = timed.length
    ? Math.floor(Math.min(...timed.map(e => timeToMins(e.start_time))) / 60) * 60
    : 0
  const latestEnd = timed.length
    ? Math.max(...timed.map(e => e.end_time ? timeToMins(e.end_time) : timeToMins(e.start_time) + 80))
    : 0
  const endMins = latestEnd + 30
  const totalH  = Math.max((endMins - startMins) * PX_PER_MIN, 48)

  const HOURS: number[] = []
  for (let m = startMins; m < endMins; m += 60) HOURS.push(m / 60)

  const topFor    = (e: Ev) => Math.max(0, (timeToMins(e.start_time) - startMins)) * PX_PER_MIN
  const heightFor = (e: Ev) => {
    const s  = timeToMins(e.start_time)
    const en = e.end_time ? timeToMins(e.end_time) : s + 80
    return Math.max(36, (en - s) * PX_PER_MIN)
  }

  const mine   = timed.filter(e => e.profile === profile)
  const theirs = timed.filter(e => e.profile === other)

  const colBg = (p: Profile) => p === 'S'
    ? 'color-mix(in srgb, #ff453a 5%, transparent)'
    : 'color-mix(in srgb, #e1abf5 5%, transparent)'

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
        {formatDateDisplay(date, { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>

      {noTime.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {noTime.map(e => {
            const c = courses.find(x => x.id === e.course_id)
            const color = c?.color || '#6366f1'
            return (
              <div key={e.id} onClick={() => onEventClick(e)} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                borderLeft: `3px solid ${color}`,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, marginRight: 4, color: e.profile === 'S' ? '#ff453a' : '#e1abf5' }}>{e.profile}</span>
                {eventTitle(e, courses, nums)}
              </div>
            )
          })}
        </div>
      )}

      {timed.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', background: 'var(--s2)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
          <div />
          {([profile, other] as Profile[]).map(p => (
            <div key={p} style={{ padding: '6px 6px 4px', fontSize: 10, fontWeight: 700, color: p === 'S' ? '#ff453a' : '#e1abf5', borderBottom: '1px solid var(--sep)', textAlign: 'center' }}>{p}</div>
          ))}

          {/* Hour labels */}
          <div style={{ position: 'relative', height: totalH }}>
            {HOURS.map(h => (
              <div key={h} style={{ position: 'absolute', top: (h * 60 - startMins) * PX_PER_MIN, right: 4, fontSize: 9, color: 'var(--tx3)', lineHeight: 1, paddingTop: 2 }}>
                {fmt12(h)}
              </div>
            ))}
          </div>

          {([mine, theirs] as Ev[][]).map((list, i) => {
            const p = i === 0 ? profile : other
            return (
              <div key={p} style={{ position: 'relative', height: totalH, background: colBg(p), borderLeft: '1px solid var(--sep)' }}>
                {HOURS.map((h, idx) => (
                  <div key={h} style={{ position: 'absolute', top: (h * 60 - startMins) * PX_PER_MIN, left: 0, right: 0, height: 60 * PX_PER_MIN, borderTop: '1px solid var(--sep)', background: idx % 2 === 1 ? 'rgba(255,255,255,.012)' : undefined, pointerEvents: 'none' }} />
                ))}
                {list.map(e => {
                  const color = courses.find(c => c.id === e.course_id)?.color || '#6366f1'
                  return (
                    <div key={e.id} style={{ position: 'absolute', top: topFor(e), height: heightFor(e), left: 2, right: 2, zIndex: 2 }}>
                      <div onClick={() => onEventClick(e)} style={{
                        height: '100%', overflow: 'hidden', cursor: 'pointer',
                        borderLeft: `3px solid ${color}`,
                        background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        borderRadius: '0 6px 6px 0', padding: '3px 5px',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3, textDecoration: e.status === 'cancelled' ? 'line-through' : undefined }}>
                          {eventTitle(e, courses, nums)}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--tx2)', marginTop: 1 }}>
                          {hhmm(e.start_time)}{e.end_time ? `–${hhmm(e.end_time)}` : ''}
                        </div>
                        {courses.find(c => c.id === e.course_id) && (
                          <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {courses.find(c => c.id === e.course_id)!.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { profile, setProfile, events, courses, loading } = useApp()
  const [now, setNow]     = useState(new Date())
  const [editEv, setEditEv] = useState<Ev | null>(null)
  const [addModal, setAddModal] = useState(false)

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  const nums     = useMemo(() => sessionNumbers(events), [events])
  const today    = ymd(now)
  const tomorrow = ymd(addDays(now, 1))
  const weekEnd  = ymd(addDays(now, 7))
  const other    = profile === 'S' ? 'K' : 'S'

  const weekEvs = useMemo(() =>
    events.filter(e => e.date > tomorrow && e.date <= weekEnd)
      .sort((a, b) => (a.date + (a.start_time || '00:00')).localeCompare(b.date + (b.start_time || '00:00'))),
    [events, tomorrow, weekEnd])

  const weekDates = useMemo(() => [...new Set(weekEvs.map(e => e.date))].sort(), [weekEvs])

  if (!profile) {
    return (
      <div className="profile-pick-screen">
        <div>
          <div className="pick-title">Trimester</div>
          <div className="pick-sub" style={{ marginTop: 6 }}>Who are you?</div>
        </div>
        <div className="pick-btns">
          {(['S','K'] as Profile[]).map(p => (
            <button key={p} className={`pick-btn ${p.toLowerCase()}`} onClick={() => setProfile(p)}>{p}</button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Shell title="Today">
      {loading && <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>Loading…</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ Add event</button>
      </div>

      <CompareTable date={today}    now={now} onEventClick={setEditEv} />
      <CompareTable date={tomorrow} now={now} onEventClick={setEditEv} />

      <hr className="divider" />

      <h2 style={{ marginBottom: 16 }}>Coming week</h2>
      {weekDates.length === 0 ? (
        <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Nothing more this week.</p>
      ) : weekDates.map(date => (
        <WeekDayTimeline
          key={date} date={date}
          evs={weekEvs.filter(e => e.date === date)}
          profile={profile} other={other as Profile}
          courses={courses} nums={nums}
          onEventClick={setEditEv}
        />
      ))}

      {addModal && <EventModal onClose={() => setAddModal(false)} defaultDate={today} />}
      {editEv   && <EventModal ev={editEv} onClose={() => setEditEv(null)} />}
    </Shell>
  )
}
