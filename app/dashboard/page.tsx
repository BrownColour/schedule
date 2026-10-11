'use client'
import { useState, useEffect, useMemo } from 'react'
import { Shell } from '@/components/layout/Shell'
import { CompareTable } from '@/components/calendar/CompareTable'
import { EventModal } from '@/components/calendar/EventModal'
import { EventCard } from '@/components/calendar/EventCard'
import { useApp } from '@/lib/state'
import { ymd, addDays, sessionNumbers, eventTitle, hhmm, formatDateDisplay } from '@/lib/utils'
import type { Ev, Profile } from '@/lib/types'

export default function Dashboard() {
  const { profile, setProfile, events, courses, loading } = useApp()
  const [now, setNow] = useState(new Date())
  const [editEv, setEditEv] = useState<Ev | null>(null)
  const [addModal, setAddModal] = useState(false)

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  const nums = useMemo(() => sessionNumbers(events), [events])
  const today = ymd(now)
  const tomorrow = ymd(addDays(now, 1))
  const weekEnd = ymd(addDays(now, 7))
  const other = profile === 'S' ? 'K' : 'S'

  // Coming week: days 2–7 from today, both users
  const allWeekEvs = useMemo(() =>
    events.filter(e => e.date > tomorrow && e.date <= weekEnd)
      .sort((a, b) => (a.date + (a.start_time || '')).localeCompare(b.date + (b.start_time || ''))),
    [events, tomorrow, weekEnd])

  // Collect all dates that have events for either user
  const weekDates = useMemo(() => {
    const dates = new Set(allWeekEvs.map(e => e.date))
    return [...dates].sort()
  }, [allWeekEvs])

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

      {/* Today & tomorrow comparison tables */}
      <CompareTable date={today}    now={now} onEventClick={setEditEv} />
      <CompareTable date={tomorrow} now={now} onEventClick={setEditEv} />

      <hr className="divider" />

      {/* Coming week: both users side by side per day */}
      <h2 style={{ marginBottom: 16 }}>Coming week</h2>
      {weekDates.length === 0 ? (
        <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Nothing more this week.</p>
      ) : (
        weekDates.map(date => {
          const myEvs    = allWeekEvs.filter(e => e.profile === profile && e.date === date)
          const otherEvs = allWeekEvs.filter(e => e.profile === other   && e.date === date)
          if (myEvs.length === 0 && otherEvs.length === 0) return null
          return (
            <div key={date} style={{ marginBottom: 20 }}>
              {/* Date header */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--tx3)',
                textTransform: 'uppercase', letterSpacing: '.5px',
                marginBottom: 8,
              }}>
                {formatDateDisplay(date, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>

              {/* Side by side columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* My column */}
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, marginBottom: 5,
                    color: profile === 'S' ? '#ff453a' : '#e1abf5',
                  }}>{profile}</div>
                  {myEvs.length === 0
                    ? <div style={{ fontSize: 12, color: 'var(--tx3)' }}>—</div>
                    : myEvs.map(e => (
                        <div key={e.id} style={{ marginBottom: 4 }}>
                          <EventCard ev={e} courses={courses} nums={nums} onClick={() => setEditEv(e)} />
                        </div>
                      ))
                  }
                </div>
                {/* Other's column */}
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, marginBottom: 5,
                    color: other === 'S' ? '#ff453a' : '#e1abf5',
                  }}>{other}</div>
                  {otherEvs.length === 0
                    ? <div style={{ fontSize: 12, color: 'var(--tx3)' }}>—</div>
                    : otherEvs.map(e => (
                        <div key={e.id} style={{ marginBottom: 4 }}>
                          <EventCard ev={e} courses={courses} nums={nums} onClick={() => setEditEv(e)} />
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          )
        })
      )}

      {addModal && <EventModal onClose={() => setAddModal(false)} defaultDate={today} />}
      {editEv   && <EventModal ev={editEv} onClose={() => setEditEv(null)} />}
    </Shell>
  )
}
