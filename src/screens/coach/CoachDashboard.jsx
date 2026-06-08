import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, AlertTriangle, ChevronRight } from 'lucide-react'

export default function CoachDashboard({ profile, session, onSelectClient }) {
  const [clients, setClients] = useState([])
  const [clientProfiles, setClientProfiles] = useState([])
  const [todaySessions, setTodaySessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    // Get connected clients
    const { data: connections } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', session.user.id)

    if (!connections?.length) { setLoading(false); return }

    const clientIds = connections.map(c => c.client_id)

    // Get client profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', clientIds)

    // Get today's sessions for all clients
    const today = new Date().toISOString().split('T')[0]
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .in('user_id', clientIds)
      .gte('date', today)

    setClients(connections)
    setClientProfiles(profiles || [])
    setTodaySessions(sessions || [])
    setLoading(false)
  }

  const activeClients = clientProfiles.filter(c => {
    const lastSession = todaySessions.find(s => s.user_id === c.id)
    return !!lastSession
  })

  const needsAttention = clientProfiles.filter(c => {
    const lastSession = todaySessions.find(s => s.user_id === c.id)
    return !lastSession
  })

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16, margin: '0 16px 12px' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Coach Dashboard</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.3px', color: 'var(--text)' }}>
            {profile?.name?.split(' ')[0]} 👋
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, marginTop: 4, background: '#FF5A1F15', border: '1px solid #FF5A1F30', color: '#FF5A1F' }}>
            🏅 Head Coach · {profile?.coach_code || 'PACE4-PT'}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--orange)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : clientProfiles.length === 0 ? (
        // Empty state
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No clients yet</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Share your coach code with athletes to get started
          </p>
          <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 20px', marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Your coach code</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#FF5A1F', letterSpacing: '.15em' }}>
              {profile?.coach_code || 'Loading...'}
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Athletes enter this in Profile → Connect to Coach</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '0 16px', marginBottom: 14 }}>
            {[
              { l: 'Clients', v: clientProfiles.length, c: '#FF5A1F' },
              { l: 'Active today', v: activeClients.length, c: '#22C55E' },
              { l: 'Sessions', v: todaySessions.length, c: '#3B82F6' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</p>
                <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Today's activity */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Today's Activity</p>
            <button onClick={() => {}} style={{ fontSize: 13, color: '#FF5A1F', background: 'none', border: 'none', cursor: 'pointer' }}>View all</button>
          </div>

          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {clientProfiles.slice(0, 5).map((client, i, arr) => {
              const clientSession = todaySessions.find(s => s.user_id === client.id)
              return (
                <button key={client.id} onClick={() => onSelectClient(client)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {client.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{client.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                      {clientSession ? `✅ ${clientSession.type} · RPE ${clientSession.rpe || '--'}/10` : '😴 No session today'}
                    </p>
                  </div>
                  <ChevronRight size={14} color="var(--subtle)" />
                </button>
              )
            })}
          </div>

          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px', marginBottom: 10 }}>
                <AlertTriangle size={16} color="#EF4444" />
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Needs Attention</p>
              </div>
              <div style={{ ...card, background: '#1a050015', borderColor: '#EF444425', padding: 0, overflow: 'hidden' }}>
                {needsAttention.map((client, i, arr) => (
                  <button key={client.id} onClick={() => onSelectClient(client)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EF444420', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>😴</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{client.name}</p>
                      <p style={{ fontSize: 11, color: '#EF4444', marginTop: 1 }}>No session logged today</p>
                    </div>
                    <ChevronRight size={14} color="var(--subtle)" />
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}