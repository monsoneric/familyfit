import { useState, useEffect } from 'react'
import { getStravaConnection, disconnectStrava } from '../lib/queries'

// Your Strava app's Client ID — set in .env
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID ?? ''

// Scopes needed: read activity data
const STRAVA_SCOPE = 'activity:read_all'

export default function StravaConnect({ member }) {
  const [connection, setConnection] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    getStravaConnection(member.id).then(c => {
      setConnection(c)
      setLoading(false)
    })
    // Handle OAuth return: ?strava=connected
    if (window.location.search.includes('strava=connected')) {
      window.history.replaceState({}, '', '/')
      getStravaConnection(member.id).then(setConnection)
    }
  }, [member.id])

  function connectStrava() {
    // Build the Strava OAuth URL with member_id in state param
    const redirectUri = encodeURIComponent(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-webhook?member_id=${member.id}`
    )
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${STRAVA_SCOPE}`
    window.location.href = url
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Strava? Future activities won\'t auto-import. Past imports are kept.')) return
    setLoading(true)
    await disconnectStrava(member.id)
    setConnection(null)
    setLoading(false)
  }

  if (!STRAVA_CLIENT_ID) return (
    <div className="rounded-lg bg-orange-50 border border-orange-100 px-4 py-3">
      <p className="text-sm font-medium text-orange-700">Strava connect</p>
      <p className="text-xs text-orange-600 mt-0.5">
        Add <code className="bg-orange-100 px-1 rounded">VITE_STRAVA_CLIENT_ID</code> to your .env to enable Strava sync.
      </p>
    </div>
  )

  return (
    <div className="rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
      {/* Strava wordmark colors */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: '#FC4C02' }}>
        <span className="text-white font-bold text-sm">S</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Strava</p>
        <p className="text-xs text-gray-400">
          {loading    ? 'Checking…' :
           connection ? `Connected · athlete #${connection.strava_athlete_id}` :
                        'Auto-import your workouts'}
        </p>
      </div>
      {!loading && (
        connection ? (
          <button onClick={handleDisconnect}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors">
            Disconnect
          </button>
        ) : (
          <button onClick={connectStrava}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{ background: '#FC4C02' }}>
            Connect
          </button>
        )
      )}
    </div>
  )
}
