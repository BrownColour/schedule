'use client'
import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/Shell'
import { CourseModal } from '@/components/courses/CourseModal'
import { EventModal } from '@/components/calendar/EventModal'
import { Modal } from '@/components/shared/Modal'
import { useApp } from '@/lib/state'
import { sessionNumbers, eventTitle, formatDateDisplay, hhmm } from '@/lib/utils'
import { EVENT_TYPE_LABELS, ASSIGNMENT_TYPES, parseEvExtras } from '@/lib/types'
import type { Course, Ev } from '@/lib/types'

function CourseDetailModal({ course, onEdit, onClose }: { course: Course; onEdit: () => void; onClose: () => void }) {
  const { events, courses, attendance } = useApp()
  const [selectedEv, setSelectedEv] = useState<Ev | null>(null)
  const nums = useMemo(() => sessionNumbers(events), [events])

  const courseEvs = events.filter(e => e.course_id === course.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  const sessions     = courseEvs.filter(e => e.type === 'session')
  const assignments  = courseEvs.filter(e => ASSIGNMENT_TYPES.includes(e.type))
  const tests        = courseEvs.filter(e => e.type === 'test' || e.type === 'exam')
  const other        = courseEvs.filter(e => !['session','test','exam',...ASSIGNMENT_TYPES].includes(e.type))

  const heldSessions = sessions.filter(e => e.status !== 'cancelled' && e.date <= new Date().toISOString().slice(0,10))
  const presentCount = heldSessions.filter(e => {
    const rec = attendance.find(a => a.event_id === e.id)
    return !rec || rec.status === 'present'
  }).length
  const attPct = heldSessions.length > 0 ? Math.round((presentCount / heldSessions.length) * 100) : 100

  const Section = ({ label, evs }: { label: string; evs: Ev[] }) => {
    if (!evs.length) return null
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{label} ({evs.length})</div>
        {evs.map(e => {
          const isAssign = ASSIGNMENT_TYPES.includes(e.type)
          const { extras } = parseEvExtras(e.description)
          const cancelled = e.status === 'cancelled'
          return (
            <div key={e.id}
              onClick={() => setSelectedEv(e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderTop: '1px solid var(--sep)',
                cursor: 'pointer', opacity: cancelled ? .45 : 1,
              }}
            >
              <div style={{ width: 3, height: 32, background: course.color, borderRadius: 2, flexShrink: 0,
                borderStyle: isAssign ? 'dashed' : 'solid', borderWidth: isAssign ? '0 0 0 3px' : 0,
                borderColor: course.color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, textDecoration: cancelled ? 'line-through' : undefined }}>
                  {eventTitle(e, courses, nums)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                  {isAssign && extras.deadline_date
                    ? `Due ${formatDateDisplay(extras.deadline_date)}${extras.deadline_time ? ' ' + hhmm(extras.deadline_time) : ''}`
                    : `${formatDateDisplay(e.date)}${e.start_time ? ' · ' + hhmm(e.start_time) : ''}`
                  }
                  {e.room ? ` · ${e.room}` : ''}
                </div>
              </div>
              {cancelled && <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 600 }}>CANCELLED</span>}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--tx3)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <Modal title={course.name} onClose={onClose} footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onEdit}>Edit course</button>
        </div>
      }>
        {/* Colour bar */}
        <div style={{ height: 4, background: course.color, margin: '-18px -20px 0', borderRadius: '16px 16px 0 0' }} />
        <div style={{ marginTop: 16 }}>
          {/* Meta */}
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
            {[course.code, course.professor, course.credit_type === 'full' ? 'Full credit' : 'Half credit'].filter(Boolean).join(' · ')}
          </div>
          {course.notes && <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>{course.notes}</div>}

          {/* Attendance summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--s3)', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Attendance</div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{presentCount}/{heldSessions.length} sessions</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: attPct < 75 ? '#ff453a' : course.color }}>{attPct}%</div>
          </div>

          <Section label="Sessions" evs={sessions} />
          <Section label="Assignments & Projects" evs={assignments} />
          <Section label="Tests & Exams" evs={tests} />
          <Section label="Other" evs={other} />

          {courseEvs.length === 0 && (
            <div className="empty"><p>No events for this course yet.</p></div>
          )}
        </div>
      </Modal>

      {selectedEv && <EventModal ev={selectedEv} onClose={() => setSelectedEv(null)} />}
    </>
  )
}

export default function CoursesPage() {
  const { profile, courses, events, activeTriId, loading } = useApp()
  const [detailCourse, setDetailCourse] = useState<Course | null>(null)
  const [editCourse, setEditCourse]     = useState<Course | null>(null)
  const [addModal, setAddModal]         = useState(false)

  const mycourses = courses.filter(c => c.profile === profile && (!activeTriId || c.trimester_id === activeTriId))
  const nums = useMemo(() => sessionNumbers(events.filter(e => e.profile === profile)), [events, profile])

  return (
    <Shell title="Courses">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ New course</button>
      </div>

      {loading && <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>Loading…</div>}

      {mycourses.length === 0 ? (
        <div className="empty"><h3>No courses yet</h3><p>Add your first course to get started.</p></div>
      ) : (
        <div className="course-list">
          {mycourses.map(c => {
            const courseEvs = events.filter(e => e.course_id === c.id && e.type === 'session' && e.status !== 'cancelled')
            const sessionCount = courseEvs.length
            const minRequired = c.min_sessions
            return (
              <div key={c.id} className="course-card" onClick={() => setDetailCourse(c)}>
                <div className="course-dot" style={{ background: c.color }} />
                <div className="course-info">
                  <div className="course-name">{c.name}</div>
                  <div className="course-meta">
                    {c.code && <span>{c.code} · </span>}
                    {c.professor && <span>{c.professor} · </span>}
                    <span>{c.credit_type === 'full' ? 'Full credit' : 'Half credit'}</span>
                  </div>
                  <div className="course-stats">
                    {sessionCount} session{sessionCount !== 1 ? 's' : ''} · min {minRequired} required
                    {sessionCount < minRequired && <span style={{ color: 'var(--ac)', marginLeft: 6 }}>({minRequired - sessionCount} more needed)</span>}
                  </div>
                  {c.notes && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>{c.notes}</div>}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--tx3)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            )
          })}
        </div>
      )}

      {addModal      && <CourseModal onClose={() => setAddModal(false)} />}
      {editCourse    && <CourseModal course={editCourse} onClose={() => setEditCourse(null)} />}
      {detailCourse  && (
        <CourseDetailModal
          course={detailCourse}
          onEdit={() => { setEditCourse(detailCourse); setDetailCourse(null) }}
          onClose={() => setDetailCourse(null)}
        />
      )}
    </Shell>
  )
}
