import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { LogOut, Moon, Sun, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function CoachProfile({ profile, session, onToggleMode, onReset, onUpdate }) {
  const { isDark, toggleTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(profile?.coach_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, margin: '0 16px 12px', overflow: 'hidden' }
  const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }
  const iconBox = { width: 38, height: 38, borderRadius: 11, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      <div style={{ padding: '0 16px 16px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>Coach Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Your coaching settings</p>
      </div>

      {/* Profile hero */}
      <div style={{ ...card, overflow: 'visible' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {profile?.name?.charAt(0) || 'C'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{profile?.name}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, marginTop: 4, background: '#FF5A1F15', border: '1px solid #FF5A1F30', color: '#FF5A1F' }}>
              🏅 Head Coach
            </div>
          </div>
        </div>
      </div>

      {/* Coach code */}
      {/* Coach code + QR */}
    <div style={{ margin: '0 16px 12px', background: 'var(--card)', border: '1px solid #FF5A1F25', borderRadius: 18, padding: 16 }}>
    <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Your coach code</p>

    {/* QR Code */}
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
        <QRCodeSVG
            value={`https://www.pace4.in?coach=${profile?.coach_code || ''}`}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
        />
        </div>
    </div>

    {/* Code display */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card2)', borderRadius: 14, padding: '12px 16px', marginBottom: 10 }}>
        <div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>Code</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#FF5A1F', letterSpacing: '.12em' }}>
            {profile?.coach_code || '—'}
        </p>
        </div>
        <button onClick={copyCode}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#22C55E' : '#FF5A1F', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
        </button>
    </div>

    <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
        Show this QR to your athlete — they scan it with their phone camera. Or share the code manually via WhatsApp.
    </p>

    {/* WhatsApp share */}
    <button onClick={() => {
        const msg = encodeURIComponent(`Hey! Join me on Pace4 🏃\nUse my coach code: *${profile?.coach_code}*\nDownload: https://www.pace4.in`)
        window.open(`https://wa.me/?text=${msg}`, '_blank')
    }}
        style={{ width: '100%', marginTop: 12, background: '#25D366', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        📱 Share via WhatsApp
    </button>
    </div>

      {/* Switch to athlete */}
      <div style={{ margin: '0 16px 12px', background: 'var(--card)', border: '1px solid #22C55E25', borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#22C55E15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏃</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Switch to Athlete Mode</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>View and track your own training</p>
        </div>
        <button onClick={onToggleMode}
          style={{ background: '#22C55E', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Switch
        </button>
      </div>

      {/* Appearance */}
      <div style={card}>
        <div style={row}>
          <div style={{ ...iconBox, background: isDark ? '#1a0d00' : '#fff5f0' }}>
            {isDark ? <Moon size={18} color="#FF5A1F" /> : <Sun size={18} color="#FF5A1F" />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{isDark ? 'Dark mode' : 'Light mode'}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Switch appearance</p>
          </div>
          <button onClick={toggleTheme}
            style={{ width: 44, height: 26, borderRadius: 13, background: !isDark ? '#FF5A1F' : 'var(--border2)', border: 'none', cursor: 'pointer', position: 'relative', transition: '.2s', flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: !isDark ? 21 : 3, transition: '.2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div style={card}>
        <button onClick={onReset}
          style={{ ...row, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
          <div style={{ ...iconBox, background: '#15000015' }}><LogOut size={18} color="#EF4444" /></div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#EF4444' }}>Sign out</p>
        </button>
      </div>

      {/* App info */}
      <div style={{ textAlign: 'center', padding: '16px 16px' }}>
        <img src="/icon-512.png" alt="Pace4" style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: '#FF5A1F' }}>Pace4 Coach</p>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>Progress · Action · Consistency · Evolution</p>
      </div>
    </div>
  )
}