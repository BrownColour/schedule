'use client'
import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Timeline } from '@/components/calendar/Timeline'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { AgendaView } from '@/components/calendar/AgendaView'
import { EventModal } from '@/components/calendar/EventModal'
import { useApp } from '@/lib/state'
import { ymd, addDays, getWeekDays } from '@/lib/utils'
import type { Ev } from '@/lib/types'

type View = 'day' | 'week' | 'month' | 'trimester'

export default function CalendarPage() {
  const { loading } = useApp()
  const [view, setView] = useState<View>('week')
  const [cursor, setCursor] = useState(new Date())
  const [editEv, setEditEv] = useState<Ev | null>(null)
  const [addDate, setAddDate] = useState<string | null>(null)

  const today = new Date()

  const nav = (dir: number) => {
    setCursor(c => {
      const d = new Date(c)
      if (view === 'day')      d.setDate(d.getDate() + dir)
      if (view === 'week')     d.setDate(d.getDate() + dir * 7)
      if (view === 'month')    d.setMonth(d.getMonth() + dir)
      if (view === 'trimester') d.setMonth(d.getMonth() + dir * 3)
      return d
    })
  }

  const label = useMemo(() => {
    if (view === 'day') return cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (view === 'week') {
      const days = getWeekDays(cursor)
      const s = days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const e = days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      return `${s} – ${e}`
    }
    if (view === 'month') return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return 'All events'
  }, [view, cursor])

  const goToday = () => setCursor(new Date())

  const drillDay = (date: string) => { setCursor(new Date(date + 'T00:00:00')); setView('day') }

  return (
    <Shell title="Calendar">
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="segmented">
          {(['day','week','month','trimester'] as View[]).map(v => (
            <button key={v} className={`seg-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="nav-arrows" style={{ flex: 1 }}>
          <button className="btn-icon" onClick={() => nav(-1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>{label}</span>
          <button className="btn-icon" onClick={() => nav(1)} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddDate(ymd(cursor))}>+ Add</button>
      </div>

      {loading && <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>Loading…</div>}

      {view === 'day' && (
        <Timeline dates={[ymd(cursor)]} onEventClick={setEditEv} />
      )}
      {view === 'week' && (
        <Timeline dates={getWeekDays(cursor).map(d => ymd(d))} onEventClick={setEditEv} />
      )}
      {view === 'month' && (
        <MonthGrid year={cursor.getFullYear()} month={cursor.getMonth()} onDayClick={drillDay} onEventClick={setEditEv} />
      )}
      {view === 'trimester' && (
        <AgendaView onEventClick={setEditEv} />
      )}

      {addDate && <EventModal defaultDate={addDate} onClose={() => setAddDate(null)} />}
      {editEv  && <EventModal ev={editEv} onClose={() => setEditEv(null)} />}
    </Shell>
  )
}
