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
        </div>

        <p style={{ textAlign: 'center', color: '#2a2a2a', fontSize: 12, marginTop: 24 }}>
          By continuing you agree to Pace4 Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}