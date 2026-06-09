import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Plug, Code2, Terminal, LogOut, Cpu } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
  { to: '/projects', icon: Code2, label: 'Projects' },
  { to: '/playground', icon: Terminal, label: 'Playground' },
]

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen bg-surface-950">
      <aside className="w-64 bg-surface-900 border-r border-surface-700/50 flex flex-col shrink-0">
        <div className="p-6 border-b border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-surface-50">AI Platform</h1>
              <p className="text-xs text-surface-400">WebContainer + AI</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-400'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t border-surface-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-medium text-surface-300">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-200 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-surface-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
