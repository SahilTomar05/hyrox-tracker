import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, ChevronRight, X } from 'lucide-react'

export default function CoachClients({ profile, session, onSelectClient }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showConnect, setShowConnect] = useState(false)
  const [coachCode, setCoachCode] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectMsg, setConnectMsg] = useState('')

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data: connections } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', session.user.id)

    if (!connections?.length) { setLoading(false); return }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', connections.map(c => c.client_id))

    setClients(profiles || [])
    setLoading(false)
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.sport?.toLowerCase().includes(query.toLowerCase())
  )

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, margin: '0 16px 12px', overflow: 'hidden' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>My Clients</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{clients.length} athletes</p>
        </div>
        <button onClick={() => setShowConnect(true)}
          style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Client
        </button>
      </div>

      {/* Add client modal */}
      {showConnect && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => { setShowConnect(false); setConnectMsg('') }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 320 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Add Client</p>
              <button onClick={() => { setShowConnect(false); setConnectMsg('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Ask your athlete to share their User ID from their Profile page, then enter it below.
            </p>
            <input
              placeholder="Athlete's User ID"
              value={coachCode}
              onChange={e => setCoachCode(e.target.value)}
              style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }}
            />
            {connectMsg && (
              <p style={{ fontSize: 13, color: connectMsg.includes('✅') ? '#22C55E' : '#EF4444', marginBottom: 10 }}>{connectMsg}</p>
            )}
            <button onClick={async () => {
              if (!coachCode.trim()) return
              setConnecting(true)
              setConnectMsg('')
              // Find profile by ID
              const { data: clientProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', coachCode.trim())
                .single()
              if (!clientProfile) {
                setConnectMsg('❌ Athlete not found. Check the ID.')
                setConnecting(false)
                return
              }
              // Create connection
              const { error } = await supabase.from('coach_clients').insert({
                coach_id: session.user.id,
                client_id: clientProfile.id,
              })
              if (error) {
                setConnectMsg(error.code === '23505' ? '⚠️ Already connected to this athlete.' : '❌ Failed to connect. Try again.')
              } else {
                setConnectMsg(`✅ Connected to ${clientProfile.name}!`)
                setClients(p => [...p, clientProfile])
                setTimeout(() => { setShowConnect(false); setCoachCode(''); setConnectMsg('') }, 1500)
              }
              setConnecting(false)
            }} disabled={connecting || !coachCode.trim()}
              style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: connecting || !coachCode.trim() ? 0.6 : 1, fontFamily: 'inherit' }}>
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="var(--muted)" />
          <input
            placeholder="Search clients..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--orange)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {query ? 'No clients match your search' : 'No clients yet — tap + Add Client'}
          </p>
        </div>
      ) : (
        <div style={card}>
          {filtered.map((client, i, arr) => {
            const SPORT_ICONS = { hyrox: '⚡', marathon: '🏃', bodybuilding: '🏋️', crossfit: '🏇', cycling: '🚴', triathlon: '🏊', ocr: '🏔️', combat: '🥊', team: '⚽', calisthenics: '🤸', general: '🎯' }
            const icon = SPORT_ICONS[client.sport] || '🎯'
            return (
              <button key={client.id} onClick={() => onSelectClient(client)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {client.name?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{client.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {icon} {client.sport || 'General'} {client.event_name ? `· ${client.event_name}` : ''}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--subtle)" />
              </button>
            )
          })}
        </div>
      )}

      {/* Coach code reminder */}
      <div style={{ margin: '0 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Your coach code — share with athletes</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#FF5A1F', letterSpacing: '.12em' }}>
          {profile?.coach_code || '—'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          Athlete goes to Profile → Connect to Coach → enters this code
        </p>
      </div>
    </div>
  )
}