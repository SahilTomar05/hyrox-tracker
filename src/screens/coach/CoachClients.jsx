import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, ChevronRight, X, UserMinus } from 'lucide-react'

export default function CoachClients({ profile, session, onSelectClient }) {
  const [clients, setClients] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showConnect, setShowConnect] = useState(false)
  const [athleteId, setAthleteId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectMsg, setConnectMsg] = useState('')
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data: conns } = await supabase
      .from('coach_clients')
      .select('*')
      .eq('coach_id', session.user.id)

    if (!conns?.length) { setLoading(false); return }
    setConnections(conns)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', conns.map(c => c.client_id))

    setClients(profiles || [])
    setLoading(false)
  }

  async function addClient() {
    if (!athleteId.trim()) return
    setConnecting(true)
    setConnectMsg('')
    const { data: clientProfile } = await supabase
      .from('profiles').select('*').eq('id', athleteId.trim()).maybeSingle()

    if (!clientProfile) {
      setConnectMsg('❌ Athlete not found. Check the User ID.')
      setConnecting(false)
      return
    }

    const { error } = await supabase.from('coach_clients').insert({
      coach_id: session.user.id,
      client_id: clientProfile.id,
    })

    if (error) {
      setConnectMsg(error.code === '23505' ? '⚠️ Already connected.' : '❌ Failed: ' + error.message)
    } else {
      setConnectMsg(`✅ Connected to ${clientProfile.name}!`)
      setClients(p => [...p, clientProfile])
      setTimeout(() => { setShowConnect(false); setAthleteId(''); setConnectMsg('') }, 1500)
    }
    setConnecting(false)
  }

  async function removeClient(clientId) {
    const clientName = clients.find(c => c.id === clientId)?.name || 'this athlete'
    if (!confirm(`Remove ${clientName} from your clients? They will be disconnected.`)) return
    setRemovingId(clientId)
    await supabase.from('coach_clients')
      .delete()
      .eq('coach_id', session.user.id)
      .eq('client_id', clientId)
    setClients(p => p.filter(c => c.id !== clientId))
    setRemovingId(null)
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.sport?.toLowerCase().includes(query.toLowerCase())
  )

  const SPORT_ICONS = { hyrox:'⚡', marathon:'🏃', bodybuilding:'🏋️', crossfit:'🏇', cycling:'🚴', triathlon:'🏊', ocr:'🏔️', combat:'🥊', team:'⚽', calisthenics:'🤸', general:'🎯' }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, margin: '0 16px 12px', overflow: 'hidden' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--muted)" />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Ask your athlete to go to their Profile page and share their User ID with you.
            </p>
            <input placeholder="Paste athlete's User ID here"
              value={athleteId} onChange={e => setAthleteId(e.target.value)}
              style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 12, padding: '11px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'monospace' }} />
            {connectMsg && (
              <p style={{ fontSize: 13, color: connectMsg.includes('✅') ? '#22C55E' : '#EF4444', marginBottom: 10 }}>{connectMsg}</p>
            )}
            <button onClick={addClient} disabled={connecting || !athleteId.trim()}
              style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: connecting || !athleteId.trim() ? 0.6 : 1 }}>
              {connecting ? 'Connecting...' : 'Add Client'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="var(--muted)" />
          <input placeholder="Search clients..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
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
            const icon = SPORT_ICONS[client.sport] || '🎯'
            const isRemoving = removingId === client.id
            return (
              <div key={client.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', opacity: isRemoving ? 0.4 : 1 }}>
                <button onClick={() => onSelectClient(client)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {client.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{client.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {icon} {client.sport || 'General'}{client.event_name ? ` · ${client.event_name}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} color="var(--subtle)" />
                </button>
                <button onClick={() => removeClient(client.id)} disabled={isRemoving}
                  style={{ width: 34, height: 34, borderRadius: 10, background: '#EF444415', border: '1px solid #EF444425', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 4 }}>
                  <UserMinus size={14} color="#EF4444" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Coach code */}
      <div style={{ margin: '0 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Your coach code</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#FF5A1F', letterSpacing: '.12em' }}>
          {profile?.coach_code || '—'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
          Athletes enter this in Profile → Connect to Coach
        </p>
      </div>
    </div>
  )
}