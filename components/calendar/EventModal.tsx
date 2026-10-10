'use client'
import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { useApp } from '@/lib/state'
import { defaultEnd, ymd } from '@/lib/utils'
import type { Ev, EventType, EventStatus } from '@/lib/types'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '@/lib/types'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  ev?: Ev
  defaultDate?: string
  onClose: () => void
}

export function EventModal({ ev, defaultDate, onClose }: Props) {
  const { profile, courses, activeTriId, addEvent, updateEvent, removeEvent, addRecurringEvents, rescheduleEvent } = useApp()
  const mycourses = courses.filter(c => c.profile === profile)
  const today = ymd(new Date())

  const [form, setForm] = useState({
    type: (ev?.type || 'session') as EventType,
    course_id: ev?.course_id || '',
    title: ev?.title || '',
    date: ev?.date || defaultDate || today,
    start_time: ev?.start_time || '09:00',
    end_time: ev?.end_time || defaultEnd('09:00'),
    room: ev?.room || '',
    status: (ev?.status || 'scheduled') as EventStatus,
    description: ev?.description || '',
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

  const handleStartTime = (v: string) => {
    setForm(f => ({ ...f, start_time: v, end_time: defaultEnd(v) }))
  }

  const toggleRecDay = (d: number) => setRecDays(ds => ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      if (ev) {
        await updateEvent(ev.id, { ...form, course_id: form.course_id || null })
      } else if (recurring && recDays.length && recUntil) {
        await addRecurringEvents(
          { profile, trimester_id: activeTriId, course_id: form.course_id || null, type: form.type, title: form.title, start_time: form.start_time, end_time: form.end_time, room: form.room, status: 'scheduled', linked_to: null, description: form.description },
          form.date, recDays, recUntil
        )
      } else {
        await addEvent({ profile, trimester_id: activeTriId, course_id: form.course_id || null, type: form.type, title: form.title, date: form.date, start_time: form.start_time, end_time: form.end_time, room: form.room, status: 'scheduled', recurring_group_id: '', linked_to: null, description: form.description })
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

  const handleDelete = async () => {
    if (!ev || !confirm('Delete this event?')) return
    await removeEvent(ev.id); onClose()
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

  return (
    <Modal
      title={ev ? 'Edit event' : 'Add event'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {ev && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
            {ev && <button className="btn btn-ghost btn-sm" onClick={() => setRescheduling(true)}>Reschedule</button>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
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
        <input className="input" placeholder="Defaults to course name or session number" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div className="form-grid">
        <div className="field"><label>Date</label><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <div className="field"><label>Room</label><input className="input" placeholder="Room 214" value={form.room} onChange={e => set('room', e.target.value)} /></div>
        <div className="field"><label>Start time</label><input className="input" type="time" value={form.start_time} onChange={e => handleStartTime(e.target.value)} /></div>
        <div className="field"><label>End time</label><input className="input" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
      </div>
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
        <textarea className="textarea" placeholder="Any notes…" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>

      {!ev && form.type === 'session' && (
        <div style={{ background: 'var(--s3)', borderRadius: 8, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
            Repeat weekly
          </label>
          {recurring && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
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
