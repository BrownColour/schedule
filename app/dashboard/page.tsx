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

  const other = profile === 'S' ? 'K' : 'S'

  // Coming week: days 2–7 from today
  const myWeek = useMemo(() =>
    events.filter(e => e.profile === profile && e.date > tomorrow && e.date <= ymd(addDays(now, 7)))
      .sort((a, b) => (a.date + (a.start_time || '')).localeCompare(b.date + (b.start_time || ''))),
    [events, profile, tomorrow, now])

  const otherWeek = useMemo(() =>
    events.filter(e => e.profile === other && e.date >= today && e.date <= ymd(addDays(now, 7))),
    [events, other, today, now])

  // Group myWeek by date
  const myWeekByDate = useMemo(() => {
    const map: Record<string, Ev[]> = {}
    myWeek.forEach(e => { map[e.date] = [...(map[e.date] || []), e] })
    return map
  }, [myWeek])

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

      {/* Today vs Tomorrow comparison */}
      <CompareTable date={today} now={now} onEventClick={setEditEv} />
      <CompareTable date={tomorrow} now={now} onEventClick={setEditEv} />

      <hr className="divider" />

      {/* Coming week: own events */}
      <h2 style={{ marginBottom: 14 }}>Your week</h2>
      {Object.keys(myWeekByDate).length === 0 ? (
        <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Nothing more this week.</p>
      ) : (
        Object.entries(myWeekByDate).map(([date, evs]) => (
          <div key={date} className="agenda-day">
            <div className="agenda-date">{formatDateDisplay(date, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
            {evs.map(e => <EventCard key={e.id} ev={e} courses={courses} nums={nums} onClick={() => setEditEv(e)} />)}
          </div>
        ))
      )}

      <hr className="divider" />

      {/* Other person's week: chips */}
      <h2 style={{ marginBottom: 12 }}>{other}'s week</h2>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {otherWeek.length === 0
          ? <span style={{ color: 'var(--tx3)', fontSize: 13 }}>Nothing this week.</span>
          : otherWeek.map(e => {
              const c = courses.find(x => x.id === e.course_id)
              return (
                <span key={e.id} className="chip" style={{ borderLeft: `3px solid ${c?.color || '#6366f1'}` }}>
                  {formatDateDisplay(e.date, { weekday: 'short', day: 'numeric' })} {hhmm(e.start_time)} {eventTitle(e, courses, nums)}
                </span>
              )
            })
        }
      </div>

      {addModal && <EventModal onClose={() => setAddModal(false)} defaultDate={today} />}
      {editEv && <EventModal ev={editEv} onClose={() => setEditEv(null)} />}
    </Shell>
  )
}
