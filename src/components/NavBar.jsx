import Avatar from './Avatar'
import { clearActiveMember } from '../lib/auth'

const tabs = [
  { id: 'dashboard', label: 'Challenges' },
  { id: 'log',       label: 'Log'        },
  { id: 'feed',      label: 'Feed'       },
  { id: 'manage',    label: 'Manage'     },
]

export default function NavBar({ member, activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-medium text-gray-900">
          <span className="text-brand text-lg">🏆</span>
          Family Fit
        </div>

        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === t.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => { clearActiveMember(); window.location.reload() }}
          className="flex items-center gap-2"
          title="Switch member"
        >
          <Avatar name={member.name} initials={member.initials} color={member.color} size="sm" />
        </button>
      </div>
    </header>
  )
}
