import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun, LogOut, Trash2, Bell, Shield, Info } from 'lucide-react'

export default function Settings({ profile, onReset }) {
  const { isDark, toggleTheme } = useTheme()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notifications, setNotifications] = useState({
    meals: false, water: false, workout: false, steps: false,
  })

  async function deleteAccount() {
    setDeleting(true)
    try {
      await Promise.all([
        supabase.from('sessions').delete().eq('user_id', profile.id),
        supabase.from('nutrition_logs').delete().eq('user_id', profile.id),
        supabase.from('weight_logs').delete().eq('user_id', profile.id),
        supabase.from('sleep_logs').delete().eq('user_id', profile.id),
        supabase.from('profiles').delete().eq('id', profile.id),
      ])
      localStorage.clear()
      await supabase.auth.signOut()
    } catch (e) {
      console.error(e)
    }
    setDeleting(false)
  }

  const c = {
    card: { margin: '0 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' },
    row: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 12 },
    rowLast: { display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 },
    icon: { width: 36, height: 36, borderRadius: 10, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    label: { flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' },
    sub: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  }

  function Toggle({ on, onToggle }) {
    return (
      <button onClick={onToggle}
        style={{ width: 44, height: 26, borderRadius: 13, background: on ? '#FF5A1F' : 'var(--border2)', border: 'none', cursor: 'pointer', position: 'relative', transition: '.2s', flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, transition: '.2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
      </button>
    )
  }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid #EF444430', borderRadius: 24, padding: 28, width: '100%', maxWidth: 320, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete account?</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              This permanently deletes your account and all data. Cannot be undone.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={deleteAccount} disabled={deleting}
                style={{ background: '#EF4444', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {deleting ? 'Deleting...' : 'Delete my account'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, padding: 13, color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '0 16px 16px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--text)' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>App preferences</p>
      </div>

      {/* Appearance */}
      <div style={{ padding: '0 16px 6px' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Appearance</p>
      </div>
      <div style={c.card}>
        <div style={c.rowLast}>
          <div style={{ ...c.icon, background: isDark ? '#1a0d00' : '#fff5f0' }}>
            {isDark ? <Moon size={18} color="#FF5A1F" /> : <Sun size={18} color="#FF5A1F" />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={c.label}>{isDark ? 'Dark mode' : 'Light mode'}</p>
            <p style={c.sub}>Switch app appearance</p>
          </div>
          <Toggle on={!isDark} onToggle={toggleTheme} />
        </div>
      </div>

      {/* Notifications */}
      <div style={{ padding: '0 16px 6px' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Notifications</p>
      </div>
      <div style={c.card}>
        {[
          { key: 'meals', icon: '🍽️', label: 'Meal reminders', sub: '9am, 1pm, 7pm' },
          { key: 'water', icon: '💧', label: 'Water reminders', sub: 'Every 2 hours' },
          { key: 'workout', icon: '💪', label: 'Workout reminder', sub: 'Daily nudge' },
          { key: 'steps', icon: '👟', label: 'Steps reminder', sub: '7pm if goal not hit' },
        ].map(({ key, icon, label, sub }, i, arr) => (
          <div key={key} style={i < arr.length - 1 ? c.row : c.rowLast}>
            <div style={c.icon}><span style={{ fontSize: 18 }}>{icon}</span></div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</p>
              <p style={c.sub}>{sub}</p>
            </div>
            <Toggle on={notifications[key]} onToggle={() => setNotifications(p => ({ ...p, [key]: !p[key] }))} />
          </div>
        ))}
      </div>

      {/* Account */}
      <div style={{ padding: '0 16px 6px' }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Account</p>
      </div>
      <div style={c.card}>
        <div style={c.row}>
          <div style={c.icon}><Shield size={18} color="var(--muted)" /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Privacy Policy</p>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
        </div>
        <div style={c.row}>
          <div style={c.icon}><Info size={18} color="var(--muted)" /></div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>App version</p>
            <p style={c.sub}>v1.0.0 · pace4.in</p>
          </div>
        </div>
        <div style={c.row}>
          <div style={{ ...c.icon, background: '#150000' }}><LogOut size={18} color="#EF4444" /></div>
          <button onClick={onReset}
            style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#EF4444' }}>Sign out</p>
          </button>
        </div>
        <div style={c.rowLast}>
          <div style={{ ...c.icon, background: '#150000' }}><Trash2 size={18} color="#EF4444" /></div>
          <button onClick={() => setShowDeleteConfirm(true)}
            style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#EF4444' }}>Delete account</p>
            <p style={c.sub}>Permanently remove all data</p>
          </button>
        </div>
      </div>

      {/* App branding */}
      <div style={{ textAlign: 'center', padding: '20px 16px' }}>
        <img src="/icon-512.png" alt="Pace4" style={{ width: 44, height: 44, borderRadius: 13, margin: '0 auto 10px', display: 'block', boxShadow: '0 4px 16px rgba(255,90,31,.3)' }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#FF5A1F' }}>Pace4</p>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Progress · Action · Consistency · Evolution
        </p>
      </div>
    </div>
  )
}