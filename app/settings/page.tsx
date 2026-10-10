'use client'
import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Modal } from '@/components/shared/Modal'
import { useApp } from '@/lib/state'
import { ymd } from '@/lib/utils'
import type { Profile } from '@/lib/types'

export default function SettingsPage() {
  const {
    profile, setProfile, theme, setTheme,
    trimesters, activeTriId, setActiveTri, addTrimester, removeTrimester,
    events, courses, attendance, reload, loading
  } = useApp()

  const [triModal, setTriModal] = useState(false)
  const [triForm, setTriForm] = useState({ name: '', start_date: ymd(new Date()), end_date: '' })
  const [switchWarning, setSwitchWarning] = useState<Profile | null>(null)
  const [syncing, setSyncing] = useState(false)

  const mytri = trimesters.filter(t => t.profile === profile)

  const handleAddTri = async () => {
    if (!triForm.name.trim() || !profile) return
    await addTrimester({ profile, name: triForm.name, start_date: triForm.start_date, end_date: triForm.end_date || null })
    setTriForm({ name: '', start_date: ymd(new Date()), end_date: '' })
    setTriModal(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    try { await reload() } finally { setSyncing(false) }
  }

  const handleDownload = () => {
    const data = { events, courses, trimesters, attendance, exported: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `trimester-backup-${profile}-${ymd(new Date())}.json`; a.click()
  }

  const confirmSwitch = (p: Profile) => {
    if (p === profile) return
    setSwitchWarning(p)
  }

  return (
    <Shell title="Settings">
      {/* Profile */}
      <h2 style={{ marginBottom: 10 }}>Profile</h2>
      <div className="settings-section">
        <div className="settings-row">
          <div style={{ flex: 1 }}>
            <div className="settings-label">Active profile</div>
            <div className="settings-sub">All your events and courses are stored under this profile.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['S','K'] as Profile[]).map(p => (
              <button key={p} className={`btn ${profile === p ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => confirmSwitch(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme */}
      <h2 style={{ marginBottom: 10, marginTop: 24 }}>Appearance</h2>
      <div className="settings-section">
        <div className="settings-row">
          <div className="settings-label">Dark mode</div>
          <button className={`toggle ${theme === 'dark' ? 'on' : ''}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode" />
        </div>
      </div>

      {/* Trimesters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 24 }}>
        <h2>Trimesters</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setTriModal(true)}>+ New</button>
      </div>
      <div className="settings-section">
        {mytri.length === 0 ? (
          <div className="settings-row"><span style={{ color: 'var(--tx3)', fontSize: 13 }}>No trimesters yet.</span></div>
        ) : mytri.map(t => (
          <div key={t.id} className="tri-item">
            <div className={activeTriId === t.id ? 'tri-active-dot' : 'tri-inactive-dot'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                {t.start_date}{t.end_date ? ` → ${t.end_date}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {activeTriId !== t.id && (
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTri(t.id)}>Set active</button>
              )}
              {activeTriId === t.id && (
                <span style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 600 }}>Active</span>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Delete ${t.name}?`)) removeTrimester(t.id) }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Sync */}
      <h2 style={{ marginBottom: 10, marginTop: 24 }}>Data</h2>
      <div className="settings-section">
        <div className="settings-row">
          <div style={{ flex: 1 }}>
            <div className="settings-label">Sync with Supabase</div>
            <div className="settings-sub">Pull the latest data from the database.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleSync} disabled={syncing || loading}>
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        <div className="settings-row">
          <div style={{ flex: 1 }}>
            <div className="settings-label">Download backup</div>
            <div className="settings-sub">Export all your data as a JSON file.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleDownload}>Download</button>
        </div>
      </div>

      {/* Trimester modal */}
      {triModal && (
        <Modal title="New trimester" onClose={() => setTriModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setTriModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddTri} disabled={!triForm.name.trim()}>Add</button>
            </>
          }
        >
          <div className="field"><label>Name</label><input className="input" placeholder="Trimester 1 · 2025" value={triForm.name} onChange={e => setTriForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-grid">
            <div className="field"><label>Start date</label><input className="input" type="date" value={triForm.start_date} onChange={e => setTriForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div className="field"><label>End date <span style={{ fontWeight: 400, color: 'var(--tx3)' }}>(optional)</span></label><input className="input" type="date" value={triForm.end_date} onChange={e => setTriForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {/* Profile switch warning */}
      {switchWarning && (
        <Modal title="Switch profile?" onClose={() => setSwitchWarning(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setSwitchWarning(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setProfile(switchWarning!); setSwitchWarning(null) }}>Switch to {switchWarning}</button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--tx2)' }}>
            You'll switch to profile <strong>{switchWarning}</strong>. Your profile {profile}'s data is still in Supabase — you can switch back anytime.
          </p>
        </Modal>
      )}
    </Shell>
  )
}
