'use client'
import { useState, useMemo } from 'react'
import { Shell } from '@/components/layout/Shell'
import { CourseModal } from '@/components/courses/CourseModal'
import { useApp } from '@/lib/state'
import { sessionNumbers } from '@/lib/utils'
import type { Course } from '@/lib/types'

export default function CoursesPage() {
  const { profile, courses, events, activeTriId, loading } = useApp()
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [addModal, setAddModal] = useState(false)

  const mycourses = courses.filter(c => c.profile === profile && (!activeTriId || c.trimester_id === activeTriId))
  const nums = useMemo(() => sessionNumbers(events.filter(e => e.profile === profile)), [events, profile])

  return (
    <Shell title="Courses">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ New course</button>
      </div>

      {loading && <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>Loading…</div>}

      {mycourses.length === 0 ? (
        <div className="empty">
          <h3>No courses yet</h3>
          <p>Add your first course to get started.</p>
        </div>
      ) : (
        <div className="course-list">
          {mycourses.map(c => {
            const courseEvs = events.filter(e => e.course_id === c.id && e.type === 'session' && e.status !== 'cancelled')
            const sessionCount = courseEvs.length
            const minRequired = c.min_sessions
            return (
              <div key={c.id} className="course-card" onClick={() => setEditCourse(c)}>
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

      {addModal   && <CourseModal onClose={() => setAddModal(false)} />}
      {editCourse && <CourseModal course={editCourse} onClose={() => setEditCourse(null)} />}
    </Shell>
  )
}
