'use client'
import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/Shell'
import { useApp } from '@/lib/state'
import { sessionNumbers, eventTitle, formatDateDisplay, ymd } from '@/lib/utils'
import type { Course, Ev } from '@/lib/types'

export default function AttendancePage() {
  const { profile, courses, events, attendance, setAttendance, loading } = useApp()
  const [expanded, setExpanded] = useState<string | null>(null)

  const mycourses = courses.filter(c => c.profile === profile)
  const nums = useMemo(() => sessionNumbers(events.filter(e => e.profile === profile)), [events, profile])
  const today = ymd(new Date())

  const courseStats = useMemo(() => {
    return mycourses.map(c => {
      const sessions = events.filter(e => e.course_id === c.id && e.type === 'session' && e.profile === profile)
      const held = sessions.filter(e => e.status !== 'cancelled' && e.date <= today)
      const upcoming = sessions.filter(e => e.date > today || e.status === 'cancelled')

      const presentCount = held.filter(e => {
        const rec = attendance.find(a => a.event_id === e.id)
        return !rec || rec.status === 'present' // default present
      }).length

      const pct = held.length > 0 ? Math.round((presentCount / held.length) * 100) : 100
      return { course: c, held, upcoming, presentCount, total: held.length, pct }
    })
  }, [mycourses, events, attendance, profile, today])

  return (
    <Shell title="Attendance">
      {loading && <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>Loading…</div>}

      {courseStats.length === 0 ? (
        <div className="empty"><h3>No courses</h3><p>Add courses and sessions to track attendance.</p></div>
      ) : (
        courseStats.map(({ course, held, upcoming, presentCount, total, pct }) => (
          <div key={course.id} className="att-course">
            <div className="att-course-header" onClick={() => setExpanded(e => e === course.id ? null : course.id)}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: course.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{course.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{presentCount}/{total} sessions attended</div>
              </div>
              <div className="att-bar-bg" style={{ maxWidth: 80 }}>
                <div className="att-bar-fill" style={{ width: `${pct}%`, background: pct < 75 ? '#ff453a' : course.color }} />
              </div>
              <div className={`att-pct`} style={{ color: pct < 75 ? '#ff453a' : 'var(--tx)' }}>{pct}%</div>
              {pct < 75 && <span className="badge-warn">Low</span>}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--tx3)', transform: expanded === course.id ? 'rotate(90deg)' : undefined, transition: 'transform .15s', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            {expanded === course.id && (
              <div className="att-sessions">
                {[...held].sort((a, b) => a.date.localeCompare(b.date)).map(e => {
                  const rec = attendance.find(a => a.event_id === e.id)
                  const status = rec?.status || 'present'
                  return (
                    <div key={e.id} className="att-session">
                      <div className="att-session-left">
                        <div className="att-session-title">{eventTitle(e, courses, nums)}</div>
                        <div className="att-session-date">{formatDateDisplay(e.date)}{e.room ? ` · ${e.room}` : ''}</div>
                      </div>
                      <button
                        className={`att-badge ${status}`}
                        onClick={() => setAttendance(e.id, status === 'present' ? 'absent' : 'present', course.id, e.date)}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {status}
                      </button>
                    </div>
                  )
                })}
                {upcoming.filter(e => e.status !== 'cancelled').map(e => (
                  <div key={e.id} className="att-session">
                    <div className="att-session-left">
                      <div className="att-session-title">{eventTitle(e, courses, nums)}</div>
                      <div className="att-session-date">{formatDateDisplay(e.date)}</div>
                    </div>
                    <span className="att-badge upcoming">Upcoming</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </Shell>
  )
}
