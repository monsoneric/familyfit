import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',         label: 'Challenges', icon: '🏆' },
  { to: '/log',      label: 'Log',        icon: '➕' },
  { to: '/feed',     label: 'Feed',       icon: '📋' },
  { to: '/workouts', label: 'Workouts',   icon: '🏋️' },
  { to: '/manage',   label: 'Manage',     icon: '⚙️' },
]

export default function NavBar({ member, onAvatarClick }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex items-center">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
        {member && (
          <button
            onClick={onAvatarClick}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-3"
            style={{ backgroundColor: member.color }}
            title={member.name}
          >
            {member.initials}
          </button>
        )}
      </div>
    </nav>
  )
}
