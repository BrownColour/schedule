'use client'
import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { useApp } from '@/lib/state'
import type { Course } from '@/lib/types'

const PRESETS = ['#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#f97316','#84cc16']

interface Props { course?: Course; onClose: () => void }

export function CourseModal({ course, onClose }: Props) {
  const { profile, trimesters, activeTriId, addCourse, updateCourse, removeCourse } = useApp()
  const mytri = trimesters.filter(t => t.profile === profile)

  const [form, setForm] = useState({
    name: course?.name || '',
    code: course?.code || '',
    professor: course?.professor || '',
    credit_type: course?.credit_type || 'full' as 'half' | 'full',
    color: course?.color || '#6366f1',
    notes: course?.notes || '',
    trimester_id: course?.trimester_id || activeTriId || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim() || !profile) return
    setSaving(true)
    const payload = { profile, trimester_id: form.trimester_id || null, name: form.name, code: form.code, professor: form.professor, credit_type: form.credit_type, min_sessions: form.credit_type === 'full' ? 20 : 10, color: form.color, notes: form.notes }
    try {
      if (course) await updateCourse(course.id, payload)
      else await addCourse(payload)
      onClose()
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!course || !confirm(`Delete ${course.name}? This won't delete its events.`)) return
    await removeCourse(course.id); onClose()
  }

  return (
    <Modal
      title={course ? 'Edit course' : 'New course'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          <div>{course && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : course ? 'Save' : 'Add course'}</button>
          </div>
        </div>
      }
    >
      <div className="field">
        <label>Course name</label>
        <input className="input" placeholder="Strategy & Leadership" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="form-grid">
        <div className="field"><label>Code <span style={{ color: 'var(--tx3)', fontWeight: 400 }}>(optional)</span></label><input className="input" placeholder="MBA 501" value={form.code} onChange={e => set('code', e.target.value)} /></div>
        <div className="field"><label>Professor</label><input className="input" placeholder="Prof. Smith" value={form.professor} onChange={e => set('professor', e.target.value)} /></div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Credit type</label>
          <select className="select" value={form.credit_type} onChange={e => set('credit_type', e.target.value)}>
            <option value="full">Full credit (min 20 sessions)</option>
            <option value="half">Half credit (min 10 sessions)</option>
          </select>
        </div>
        <div className="field">
          <label>Trimester</label>
          <select className="select" value={form.trimester_id} onChange={e => set('trimester_id', e.target.value)}>
            <option value="">No trimester</option>
            {mytri.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Colour</label>
        <div className="color-row">
          {PRESETS.map(c => (
            <button key={c} type="button" className={`color-swatch ${form.color === c ? 'sel' : ''}`}
              style={{ background: c }} onClick={() => set('color', c)} aria-label={c} />
          ))}
          <input type="color" value={form.color} onChange={e => set('color', e.target.value)} title="Custom colour" />
        </div>
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea className="textarea" placeholder="Anything to remember about this course" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
    </Modal>
  )
}
