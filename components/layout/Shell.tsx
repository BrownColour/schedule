'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/lib/state'
import type { ReactNode } from 'react'

const TABS = [
  { path: '/dashboard', label: 'Today', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { path: '/calendar', label: 'Calendar', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="12" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/>
    </svg>
  )},
  { path: '/courses', label: 'Courses', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  )},
  { path: '/attendance', label: 'Attendance', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )},
  { path: '/settings', label: 'Settings', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )},
]

export function Shell({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { profile, trimesters, activeTriId } = useApp()
  const activeTri = trimesters.find(t => t.id === activeTriId)

  return (
    <div className="shell">
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-logo">Tri<span>mester</span></div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button key={t.path} className={`nav-link ${path === t.path ? 'active' : ''}`} onClick={() => router.push(t.path)}>
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-profile">
          <div className="profile-dot">{profile}</div>
          <div>
            <div className="profile-name">{profile}</div>
            <div className="profile-sub">{activeTri?.name || 'No trimester'}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
          {/* Profile + trimester visible on mobile topbar */}
          {profile && (
            <div className="topbar-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--ac)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'var(--bg)',
                }}>{profile}</div>
                {activeTri && <span style={{ fontSize: 11, color: 'var(--tx3)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTri.name}</span>}
              </div>
            </div>
          )}
          {action}
        </header>
        <main className="page-content">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {TABS.map(t => (
            <button key={t.path} className={`bn-item ${path === t.path ? 'active' : ''}`} onClick={() => router.push(t.path)}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
