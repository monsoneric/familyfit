import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { hashPasscode, clearActiveMember } from '../lib/auth'

export default function SettingsPage({ member }) {
  const [section, setSection] = useState(null)   // 'passcode' | 'family'

  // Passcode change state
  const [currentPasscode, setCurrentPasscode] = useState('')
  const [newPasscode,     setNewPasscode]     = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [passcodeStatus,  setPasscodeStatus]  = useState('')  // 'success' | 'error'
  const [passcodeMsg,     setPasscodeMsg]     = useState('')
  const [savingPasscode,  setSavingPasscode]  = useState(false)

  // Family name state
  const [familyName,     setFamilyName]     = useState('')
  const [savingName,     setSavingName]     = useState(false)
  const [nameStatus,     setNameStatus]     = useState('')

  async function handlePasscodeChange(e) {
    e.preventDefault()
    setPasscodeStatus('')
    setPasscodeMsg('')

    if (newPasscode.length < 6) {
      setPasscodeStatus('error')
      setPasscodeMsg('New passcode must be at least 6 characters.')
      return
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeStatus('error')
      setPasscodeMsg('New passcodes do not match.')
      return
    }

    setSavingPasscode(true)
    try {
      // Verify current passcode
      const currentHash = await hashPasscode(currentPasscode)
      const { data: stored } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'passcode_hash')
        .single()

      if (stored?.value !== currentHash) {
        setPasscodeStatus('error')
        setPasscodeMsg('Current passcode is incorrect.')
        setSavingPasscode(false)
        return
      }

      // Save new hash
      const newHash = await hashPasscode(newPasscode)
      const { error } = await supabase
        .from('settings')
        .update({ value: newHash, updated_at: new Date().toISOString() })
        .eq('key', 'passcode_hash')

      if (error) throw error

      setPasscodeStatus('success')
      setPasscodeMsg('Passcode updated! Everyone will use the new passcode next time they log in.')
      setCurrentPasscode('')
      setNewPasscode('')
      setConfirmPasscode('')
      setSection(null)
    } catch (err) {
      setPasscodeStatus('error')
      setPasscodeMsg('Something went wrong. Try again.')
    }
    setSavingPasscode(false)
  }

  async function handleFamilyNameChange(e) {
    e.preventDefault()
    if (!familyName.trim()) return
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: familyName.trim(), updated_at: new Date().toISOString() })
        .eq('key', 'family_name')
      if (error) throw error
      setNameStatus('success')
      setTimeout(() => setNameStatus(''), 3000)
      setSection(null)
    } catch {
      setNameStatus('error')
    }
    setSavingName(false)
  }

  function handleSignOut() {
    clearActiveMember()
    window.location.reload()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Passcode status banners — shown outside form too */}
      {passcodeStatus === 'success' && (
        <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium">
          ✓ {passcodeMsg}
        </div>
      )}

      {/* Change passcode */}
      <div className="card">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setSection(s => s === 'passcode' ? null : 'passcode')}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔑</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Family passcode</p>
              <p className="text-xs text-gray-400 mt-0.5">Change the shared login passcode</p>
            </div>
          </div>
          <span className="text-gray-300 text-lg">{section === 'passcode' ? '︿' : '﹀'}</span>
        </div>

        {section === 'passcode' && (
          <form onSubmit={handlePasscodeChange} className="mt-4 space-y-3 border-t border-gray-50 pt-4">
            <div>
              <label className="label">Current passcode</label>
              <input
                type="password"
                className="input"
                placeholder="Enter current passcode"
                value={currentPasscode}
                onChange={e => setCurrentPasscode(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">New passcode</label>
              <input
                type="password"
                className="input"
                placeholder="At least 6 characters"
                value={newPasscode}
                onChange={e => setNewPasscode(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Confirm new passcode</label>
              <input
                type="password"
                className="input"
                placeholder="Type it again"
                value={confirmPasscode}
                onChange={e => setConfirmPasscode(e.target.value)}
                required
              />
            </div>

            {passcodeStatus === 'error' && (
              <p className="text-sm text-red-500">{passcodeMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={savingPasscode}>
                {savingPasscode ? 'Saving…' : 'Update passcode'}
              </button>
              <button type="button" className="btn-outline" onClick={() => setSection(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Family name */}
      <div className="card">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setSection(s => s === 'family' ? null : 'family')}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🏠</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Family name</p>
              <p className="text-xs text-gray-400 mt-0.5">Change how the app title appears</p>
            </div>
          </div>
          <span className="text-gray-300 text-lg">{section === 'family' ? '︿' : '﹀'}</span>
        </div>

        {section === 'family' && (
          <form onSubmit={handleFamilyNameChange} className="mt-4 space-y-3 border-t border-gray-50 pt-4">
            <div>
              <label className="label">Family name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. The Monsons"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                required
                autoFocus
              />
            </div>
            {nameStatus === 'error' && (
              <p className="text-sm text-red-500">Something went wrong. Try again.</p>
            )}
            {nameStatus === 'success' && (
              <p className="text-sm text-green-600 font-medium">✓ Family name updated.</p>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={savingName}>
                {savingName ? 'Saving…' : 'Update name'}
              </button>
              <button type="button" className="btn-outline" onClick={() => setSection(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logged in as */}
      <div className="card">
        <div className="flex items-center gap-3">
          <span className="text-xl">👤</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Logged in as</p>
            <p className="text-xs text-gray-400 mt-0.5">{member.name}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400 transition-colors"
          >
            Switch member
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="card">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Family Fit</p>
            <p className="text-xs text-gray-400 mt-0.5">Version 3.0 · Built with React + Supabase</p>
          </div>
        </div>
      </div>

    </div>
  )
}
