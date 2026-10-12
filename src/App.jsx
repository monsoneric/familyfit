import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getActiveMember, clearActiveMember } from './lib/auth'
import NavBar from './components/NavBar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LogPage from './pages/LogPage'
import FeedPage from './pages/FeedPage'
import ManagePage from './pages/ManagePage'
import SettingsPage from './pages/SettingsPage'
import WorkoutsPage from './pages/WorkoutsPage'

export default function App() {
  const [member, setMember] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const m = getActiveMember()
    if (m) setMember(m)
    setReady(true)
  }, [])

  if (!ready) return null

  if (!member) {
    return (
      <BrowserRouter>
        <LoginPage onLogin={m => setMember(m)} />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <NavBar
        member={member}
        onAvatarClick={() => window.location.href = '/settings'}
      />
      <Routes>
        <Route path="/"         element={<DashboardPage member={member} />} />
        <Route path="/log"      element={<LogPage member={member} />} />
        <Route path="/feed"     element={<FeedPage member={member} />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/manage"   element={<ManagePage member={member} />} />
        <Route path="/settings" element={<SettingsPage member={member} onMemberChange={m => { if (m) setMember(m); else { clearActiveMember(); setMember(null) } }} />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
