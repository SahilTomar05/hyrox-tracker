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
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup() {
    if (!name.trim()) { setError('Please enter your name'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#00E5A0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">1F</span>
          </div>
          <h1 className="text-2xl font-bold text-white">OneFitness</h1>
          <p className="text-[#666] text-sm mt-1">Your Hyrox training companion</p>
        </div>

        {/* Tab toggle */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-[#1a1a1a] p-1 rounded-2xl">
          <button onClick={() => { setMode('login'); setError(''); setMessage('') }}
            className={`py-2 rounded-xl text-sm font-medium transition-all
              ${mode === 'login' ? 'bg-[#00E5A0] text-black' : 'text-[#666]'}`}>
            Log in
          </button>
          <button onClick={() => { setMode('signup'); setError(''); setMessage('') }}
            className={`py-2 rounded-xl text-sm font-medium transition-all
              ${mode === 'signup' ? 'bg-[#00E5A0] text-black' : 'text-[#666]'}`}>
            Sign up
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <input
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0] text-sm"
            />
          )}
          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0] text-sm"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0] text-sm"
          />

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
          {message && <p className="text-[#00E5A0] text-xs px-1">{message}</p>}

          <button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full bg-[#00E5A0] text-black font-medium py-3 rounded-2xl text-sm disabled:opacity-50">
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[#444] text-xs">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          <button onClick={handleGoogle}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-[#444] text-xs mt-6">
          By continuing you agree to OneFitness Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}