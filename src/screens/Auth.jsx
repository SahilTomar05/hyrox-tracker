import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup() {
    if (!name.trim()) { setError('Please enter your name'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: 'https://www.pace4.in' }
    })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://www.pace4.in' }
    })
  }

  const inp = {
    width: '100%', background: '#0f0f0f', border: '1px solid #252525',
    borderRadius: 14, padding: '13px 16px', color: '#fff', fontSize: 15,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/icon-512.png"
            alt="Pace4"
            style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 16px', display: 'block', boxShadow: '0 8px 32px rgba(255,90,31,.3)' }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-.5px', marginBottom: 6 }}>Pace4</h1>
          <p style={{ fontSize: 13, color: '#444' }}>Progress · Action · Consistency · Evolution</p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 16, padding: 4, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }}
              style={{ padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', transition: '.2s', background: mode === m ? '#FF5A1F' : 'transparent', color: mode === m ? '#fff' : '#444' }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inp}
            />
          )}
          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inp}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            style={inp}
          />

          {error && (
            <p style={{ color: '#EF4444', fontSize: 13, padding: '0 4px' }}>{error}</p>
          )}
          {message && (
            <div style={{ background: '#FF5A1F15', border: '1px solid #FF5A1F30', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ color: '#FF5A1F', fontSize: 13 }}>✓ {message}</p>
            </div>
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: '14px 0', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 20px rgba(255,90,31,.35)', letterSpacing: '.02em' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            <span style={{ color: '#333', fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
          </div>

          <button onClick={handleGoogle}
            style={{ width: '100%', background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, padding: '13px 0', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#2a2a2a', fontSize: 12, marginTop: 24 }}>
          By continuing you agree to Pace4 Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}