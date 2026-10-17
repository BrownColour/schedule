'use client'
import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { useApp } from '@/lib/state'
import { defaultEnd, ymd, hhmm, eventTitle, sessionNumbers, isDashType, formatDateDisplay } from '@/lib/utils'
import type { Ev, EventType, EventStatus } from '@/lib/types'
import { EVENT_TYPES, EVENT_TYPE_LABELS, ASSIGNMENT_TYPES, encodeEvExtras, parseEvExtras } from '@/lib/types'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  ev?: Ev
  defaultDate?: string
  onClose: () => void
}

// ── Preview ───────────────────────────────────────────────────────────────────
function EventPreview({ ev, onEdit, onClose }: { ev: Ev; onEdit: () => void; onClose: () => void }) {
  const { courses, events, removeEvent } = useApp()
  const nums = sessionNumbers(events)
  const course = courses.find(c => c.id === ev.course_id)
  const color = course?.color || '#6366f1'
  const title = eventTitle(ev, courses, nums)
  const { extras, notes } = parseEvExtras(ev.description)
  const isAssignment = ASSIGNMENT_TYPES.includes(ev.type)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return
    setDeleting(true)
    await removeEvent(ev.id)
    onClose()
  }

  return (
    <Modal title="" onClose={onClose} footer={
      <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>Delete</button>
        <button className="btn btn-primary" onClick={onEdit}>Edit</button>
      </div>
    }>
      {/* Colour strip */}
      <div style={{ height: 4, background: color, margin: '-18px -20px 0', borderRadius: '16px 16px 0 0' }} />
      <div style={{ marginTop: 16 }}>
        {/* Type badge */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
          {EVENT_TYPE_LABELS[ev.type]}{ev.status === 'cancelled' ? ' · Cancelled' : ''}
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.3px', marginBottom: 12, textDecoration: ev.status === 'cancelled' ? 'line-through' : undefined }}>
          {title}
        </div>

        {/* Course */}
        {course && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{course.name}</span>
              {course.professor && <span style={{ fontSize: 12, color: 'var(--tx3)', marginLeft: 6 }}>· {course.professor}</span>}
            </div>
          </div>
        )}

        {/* Date/time or deadline */}
        {isAssignment && extras.deadline_date ? (
          <div style={{ background: 'var(--s3)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', marginBottom: 4 }}>DEADLINE</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {formatDateDisplay(extras.deadline_date, { weekday: 'long', month: 'short', day: 'numeric' })}
              {extras.deadline_time && ` at ${hhmm(extras.deadline_time)}`}
            </div>
          </div>
        ) : ev.date ? (
          <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 8 }}>
            📅 {formatDateDisplay(ev.date, { weekday: 'long', month: 'short', day: 'numeric' })}
            {ev.start_time && ` · ${hhmm(ev.start_time)}${ev.end_time ? `–${hhmm(ev.end_time)}` : ''}`}
          </div>
        ) : null}

        {ev.room && <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 8 }}>📍 {ev.room}</div>}

        {isAssignment && extras.submission_mode && (
          <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 8 }}>📤 {extras.submission_mode}</div>
        )}

        {notes && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--tx2)', background: 'var(--s3)', borderRadius: 8, padding: '10px 12px' }}>
            {notes}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Edit form ─────────────────────────────────────────────────────────────────
export function EventModal({ ev, defaultDate, onClose }: Props) {
  const { profile, courses, activeTriId, addEvent, updateEvent, removeEvent, addRecurringEvents, rescheduleEvent, events } = useApp()
  const mycourses = courses.filter(c => c.profile === profile)
  const today = ymd(new Date())

  // Parse existing extras if editing
  const existingExtras = ev ? parseEvExtras(ev.description) : null

  const isAssignment = (t: string) => ASSIGNMENT_TYPES.includes(t as EventType)

  const [previewMode, setPreviewMode] = useState(!!ev)  // show preview first when editing
  const [form, setForm] = useState({
    type: (ev?.type || 'session') as EventType,
    course_id: ev?.course_id || '',
    title: ev?.title || '',
    date: ev?.date || defaultDate || today,
    start_time: ev?.start_time || '09:00',
    end_time: ev?.end_time || defaultEnd('09:00'),
    room: ev?.room || '',
    status: (ev?.status || 'scheduled') as EventStatus,
    notes: existingExtras?.notes || (ev && !ev.description.startsWith('__EXT__') ? ev.description : '') || '',
    // assignment extras
    deadline_date: existingExtras?.extras.deadline_date || ev?.date || defaultDate || today,
    deadline_time: existingExtras?.extras.deadline_time || '',
    submission_mode: existingExtras?.extras.submission_mode || '',
  })

  const [recurring, setRecurring] = useState(false)
  const [recDays, setRecDays] = useState<number[]>([])
  const [recUntil, setRecUntil] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [rsDate, setRsDate] = useState(form.date)
  const [rsStart, setRsStart] = useState(form.start_time)
  const [rsEnd, setRsEnd] = useState(form.end_time)
  const [rsRoom, setRsRoom] = useState(form.room)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const handleStartTime = (v: string) => setForm(f => ({ ...f, start_time: v, end_time: defaultEnd(v) }))
  const toggleRecDay = (d: number) => setRecDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d])

  const buildDescription = () => {
    if (isAssignment(form.type) && (form.deadline_date || form.deadline_time || form.submission_mode)) {
      return encodeEvExtras({
        deadline_date: form.deadline_date,
        deadline_time: form.deadline_time,
        submission_mode: form.submission_mode,
        notes: form.notes,
      }, form.notes)
    }
    return form.notes
  }

  // For assignments: use deadline_date as the event date if no start_time
  const resolvedDate = isAssignment(form.type) && form.deadline_date ? form.deadline_date : form.date
  const resolvedStart = isAssignment(form.type) && !form.start_time ? (form.deadline_time || null) : form.start_time
  const resolvedEnd = isAssignment(form.type) && !form.start_time ? (form.deadline_time || null) : form.end_time

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const description = buildDescription()
    try {
      if (ev) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { notes, deadline_date, deadline_time, submission_mode, ...rest } = form
        await updateEvent(ev.id, {
          ...rest,
          date: resolvedDate,
          start_time: resolvedStart,
          end_time: resolvedEnd,
          course_id: form.course_id || null,
          description,
        })
      } else if (recurring && recDays.length && recUntil) {
        await addRecurringEvents(
          { profile, trimester_id: activeTriId, course_id: form.course_id || null, type: form.type, title: form.title, start_time: form.start_time, end_time: form.end_time, room: form.room, status: 'scheduled', linked_to: null, description },
          form.date, recDays, recUntil
        )
      } else {
        await addEvent({
          profile, trimester_id: activeTriId,
          course_id: form.course_id || null,
          type: form.type, title: form.title,
          date: resolvedDate,
          start_time: resolvedStart,
          end_time: resolvedEnd,
          room: form.room, status: 'scheduled',
          recurring_group_id: '', linked_to: null,
          description,
        })
      }
      onClose()
    } finally { setSaving(false) }
  }

  const handleReschedule = async () => {
    if (!ev) return
    setSaving(true)
    try { await rescheduleEvent(ev.id, rsDate, rsStart, rsEnd, rsRoom); onClose() }
    finally { setSaving(false) }
  }

  // Show preview for existing events
  if (previewMode && ev) {
    return <EventPreview ev={ev} onEdit={() => setPreviewMode(false)} onClose={onClose} />
  }

  if (rescheduling && ev) {
    return (
      <Modal title="Reschedule event" onClose={() => setRescheduling(false)}
        footer={<><button className="btn btn-ghost" onClick={() => setRescheduling(false)}>Back</button><button className="btn btn-primary" onClick={handleReschedule} disabled={saving}>Reschedule</button></>}>
        <div className="form-grid">
          <div className="field"><label>New date</label><input className="input" type="date" value={rsDate} onChange={e => setRsDate(e.target.value)} /></div>
          <div className="field"><label>Start time</label><input className="input" type="time" value={rsStart} onChange={e => { setRsStart(e.target.value); setRsEnd(defaultEnd(e.target.value)) }} /></div>
          <div className="field"><label>End time</label><input className="input" type="time" value={rsEnd} onChange={e => setRsEnd(e.target.value)} /></div>
          <div className="field"><label>Room</label><input className="input" placeholder="Room" value={rsRoom} onChange={e => setRsRoom(e.target.value)} /></div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--tx3)' }}>Original event will be marked cancelled and linked to the new one.</p>
      </Modal>
    )
  }

  const showAssignmentFields = isAssignment(form.type)

  return (
    <Modal
      title={ev ? 'Edit event' : 'Add event'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {ev && <button className="btn btn-danger btn-sm" onClick={async () => { if (!ev || !confirm('Delete?')) return; await removeEvent(ev.id); onClose() }}>Delete</button>}
            {ev && <button className="btn btn-ghost btn-sm" onClick={() => setRescheduling(true)}>Reschedule</button>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ev && <button className="btn btn-ghost" onClick={() => setPreviewMode(true)}>Cancel</button>}
            {!ev && <button className="btn btn-ghost" onClick={onClose}>Cancel</button>}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : ev ? 'Save' : 'Add event'}</button>
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Type</label>
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Course</label>
          <select className="select" value={form.course_id} onChange={e => set('course_id', e.target.value)}>
            <option value="">No course</option>
            {mycourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Title <span style={{ color: 'var(--tx3)', fontWeight: 400 }}>(optional)</span></label>
        <input className="input" placeholder="Defaults to course name" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>

      {/* Assignment-specific fields */}
      {showAssignmentFields ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Deadline</div>
          <div className="form-grid">
            <div className="field"><label>Deadline date</label><input className="input" type="date" value={form.deadline_date} onChange={e => set('deadline_date', e.target.value)} /></div>
            <div className="field"><label>Deadline time <span style={{ fontWeight: 400, color: 'var(--tx3)' }}>(optional)</span></label><input className="input" type="time" value={form.deadline_time} onChange={e => set('deadline_time', e.target.value)} /></div>
          </div>
          <div className="field">
            <label>Submission mode <span style={{ fontWeight: 400, color: 'var(--tx3)' }}>(optional)</span></label>
            <input className="input" placeholder="e.g. Online portal, Hard copy, Email" value={form.submission_mode} onChange={e => set('submission_mode', e.target.value)} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--sep)' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Session (optional)</div>
          <div className="form-grid">
            <div className="field"><label>Date</label><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="field"><label>Room</label><input className="input" placeholder="Room 214" value={form.room} onChange={e => set('room', e.target.value)} /></div>
            <div className="field"><label>Start time</label><input className="input" type="time" value={form.start_time} onChange={e => handleStartTime(e.target.value)} /></div>
            <div className="field"><label>End time</label><input className="input" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
          </div>
        </>
      ) : (
        <div className="form-grid">
          <div className="field"><label>Date</label><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="field"><label>Room</label><input className="input" placeholder="Room 214" value={form.room} onChange={e => set('room', e.target.value)} /></div>
          <div className="field"><label>Start time</label><input className="input" type="time" value={form.start_time} onChange={e => handleStartTime(e.target.value)} /></div>
          <div className="field"><label>End time</label><input className="input" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
        </div>
      )}

      {ev && (
        <div className="field">
          <label>Status</label>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      <div className="field">
        <label>Notes</label>
        <textarea className="textarea" placeholder="Any notes…" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      {!ev && form.type === 'session' && (
        <div style={{ background: 'var(--s3)', borderRadius: 8, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
            Repeat weekly
          </label>
          {recurring && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAYS_OF_WEEK.map((d, i) => (
                  <button key={i} type="button"
                    onClick={() => toggleRecDay(i)}
                    className={`btn btn-sm ${recDays.includes(i) ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ minWidth: 36 }}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="field">
                <label>Repeat until</label>
                <input className="input" type="date" value={recUntil} onChange={e => setRecUntil(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
