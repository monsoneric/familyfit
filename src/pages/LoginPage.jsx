import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { hashPasscode, setActiveMember } from '../lib/auth'
import { getMembers } from '../lib/queries'
import Avatar from '../components/Avatar'

export default function LoginPage({ onLogin }) {
  const [passcode,  setPasscode]  = useState('')
  const [members,   setMembers]   = useState(null)   // null = not yet verified
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function verifyPasscode(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const hash   = await hashPasscode(passcode)
      const stored = await supabase.from('settings').select('value').eq('key', 'passcode_hash').single()
      if (stored.data?.value !== hash) {
        setError('Incorrect passcode. Try again.')
        setLoading(false)
        return
      }
      const list = await getMembers()
      setMembers(list)
    } catch (err) {
      setError('Connection error. Check your setup.')
    }
    setLoading(false)
  }

  function selectMember(m) {
    setActiveMember(m)
    onLogin(m)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-medium text-gray-900">Family Fit</h1>
          <p className="text-gray-500 text-sm mt-1">Your family fitness challenge tracker</p>
        </div>

        {!members ? (
          <form onSubmit={verifyPasscode} className="card space-y-4">
            <div>
              <label className="label">Family passcode</label>
              <input
                type="password"
                className="input"
                placeholder="Enter passcode"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        ) : (
          <div className="card">
            <p className="text-sm font-medium text-gray-700 mb-4">Who are you?</p>
            <div className="space-y-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => selectMember(m)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
                >
                  <Avatar name={m.name} initials={m.initials} color={m.color} />
                  <span className="font-medium text-gray-900">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
