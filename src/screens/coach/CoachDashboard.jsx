import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronRight, AlertTriangle, Users } from 'lucide-react'

export default function CoachDashboard({ profile, session, onSelectClient }) {
  const [clientProfiles, setClientProfiles] = useState([])
  const [todaySessions, setTodaySessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const { data: connections, error: connErr } = await supabase
        .from('coach_clients')
        .select('*')
        .eq('coach_id', session.user.id)

      if (connErr) { console.error('Connections error:', connErr); setLoading(false); return }
      if (!connections?.length) { setLoading(false); return }

      const clientIds = connections.map(c => c.client_id)

      const [{ data: profiles }, { data: sessions }] = await Promise.all([
        supabase.from('profiles').select('*').in('id', clientIds),
        supabase.from('sessions').select('*').in('user_id', clientIds)
          .gte('date', new Date(new Date().getTime()+(5.5*60*60*1000)).toISOString().split('T')[0]),
      ])

      setClientProfiles(profiles || [])
      setTodaySessions(sessions || [])
    } catch (e) { console.error('fetchAll error:', e) }
    setLoading(false)
  }

  const activeToday = clientProfiles.filter(c => todaySessions.find(s => s.user_id === c.id))
  const needsAttention = clientProfiles.filter(c => !todaySessions.find(s => s.user_id === c.id))

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, margin: '0 16px 12px', overflow: 'hidden' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '0 16px 16px' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Coach Dashboard</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.3px' }}>
          {profile?.name?.split(' ')[0]} 👋
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, marginTop: 6, background: '#FF5A1F15', border: '1px solid #FF5A1F30', color: '#FF5A1F' }}>
          🏅 Coach · {profile?.coach_code || '—'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>Loading clients...</p>
        </div>
      ) : clientProfiles.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px', overflow: 'visible' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No clients yet</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Share your coach code with athletes to get started
          </p>
          <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Your coach code</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: '#FF5A1F', letterSpacing: '.15em' }}>
              {profile?.coach_code || '—'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
              Athletes enter this in Profile → Connect to Coach
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '0 16px', marginBottom: 16 }}>
            {[
              { l: 'Total', v: clientProfiles.length, c: '#FF5A1F', icon: '👥' },
              { l: 'Active today', v: activeToday.length, c: '#22C55E', icon: '✅' },
              { l: 'Need check', v: needsAttention.length, c: '#EF4444', icon: '⚠️' },
            ].map(({ l, v, c, icon }) => (
              <div key={l} style={{ background: 'var(--card)', border: `1px solid ${c}20`, borderRadius: 16, padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <p style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</p>
                <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Active clients */}
          {activeToday.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', padding: '0 16px', marginBottom: 8 }}>✅ Active Today</p>
              <div style={card}>
                {activeToday.map((client, i, arr) => {
                  const s = todaySessions.find(s => s.user_id === client.id)
                  return (
                    <button key={client.id} onClick={() => onSelectClient(client)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {client.name?.charAt(0) || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{client.name}</p>
                        <p style={{ fontSize: 11, color: '#22C55E', marginTop: 2 }}>
                          {s?.type} · RPE {s?.rpe || '—'}/10 · {(s?.exercises || []).length} exercises
                        </p>
                      </div>
                      <ChevronRight size={16} color="var(--subtle)" />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 8 }}>
                <AlertTriangle size={15} color="#EF4444" />
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>No session today</p>
              </div>
              <div style={{ ...card, borderColor: '#EF444420' }}>
                {needsAttention.map((client, i, arr) => (
                  <button key={client.id} onClick={() => onSelectClient(client)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>😴</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{client.name}</p>
                      <p style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>
                        {client.sport || 'General'} · No session logged
                      </p>
                    </div>
                    <ChevronRight size={16} color="var(--subtle)" />
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