import { useState } from 'react'
import { getActiveMember } from './lib/auth'
import LoginPage     from './pages/LoginPage'
import NavBar        from './components/NavBar'
import DashboardPage from './pages/DashboardPage'
import LogPage       from './pages/LogPage'
import FeedPage      from './pages/FeedPage'
import ManagePage    from './pages/ManagePage'

export default function App() {
  const [member, setMember] = useState(() => getActiveMember())
  const [tab,    setTab]    = useState('dashboard')

  if (!member) {
    return <LoginPage onLogin={m => { setMember(m); setTab('dashboard') }} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar member={member} activeTab={tab} onTabChange={setTab} />
      {tab === 'dashboard' && <DashboardPage member={member} />}
      {tab === 'log'       && <LogPage       member={member} />}
      {tab === 'feed'      && <FeedPage      member={member} />}
      {tab === 'manage'    && <ManagePage    member={member} />}
    </div>
  )
}
