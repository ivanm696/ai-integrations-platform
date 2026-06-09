import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plug, Code2, Terminal, Zap, Clock, CheckCircle2, XCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Integration, Project, ExecutionLog } from '../lib/types'

export default function Dashboard() {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [recentLogs, setRecentLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [intRes, projRes, logRes] = await Promise.all([
        supabase.from('integrations').select('*, provider:ai_providers(*)').eq('user_id', user!.id),
        supabase.from('projects').select('*, integration:integrations(name)').eq('user_id', user!.id),
        supabase.from('execution_logs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      ])
      setIntegrations(intRes.data ?? [])
      setProjects(projRes.data ?? [])
      setRecentLogs(logRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeIntegrations = integrations.filter(i => i.is_active)
  const activeProjects = projects.filter(p => p.status === 'running')
  const totalTokens = recentLogs.reduce((sum, l) => sum + l.tokens_used, 0)

  const stats = [
    { label: 'Integrations', value: integrations.length, sub: `${activeIntegrations.length} active`, icon: Plug, color: 'primary' },
    { label: 'Projects', value: projects.length, sub: `${activeProjects.length} running`, icon: Code2, color: 'secondary' },
    { label: 'Executions', value: recentLogs.length, sub: `${totalTokens} tokens`, icon: Zap, color: 'accent' },
    { label: 'Success Rate', value: recentLogs.length ? `${Math.round(recentLogs.filter(l => l.status === 'success').length / recentLogs.length * 100)}%` : '--', sub: 'Last 10', icon: TrendingUp, color: 'secondary' },
  ]

  const colorMap: Record<string, string> = {
    primary: 'bg-primary-600/15 text-primary-400',
    secondary: 'bg-secondary-600/15 text-secondary-400',
    accent: 'bg-accent-600/15 text-accent-400',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-surface-50">Dashboard</h1>
        <p className="text-surface-400 mt-1">Overview of your AI integrations and projects</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-surface-900 rounded-xl border border-surface-700/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-400">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-surface-50">{value}</p>
            <p className="text-xs text-surface-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-900 rounded-xl border border-surface-700/50">
          <div className="flex items-center justify-between p-5 border-b border-surface-700/50">
            <h2 className="text-base font-semibold text-surface-100">Recent Integrations</h2>
            <Link to="/integrations" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {integrations.length === 0 ? (
            <div className="p-8 text-center">
              <Plug className="w-10 h-10 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">No integrations yet</p>
              <Link to="/integrations" className="text-sm text-primary-400 hover:text-primary-300 mt-2 inline-block">
                Add your first integration
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-700/50">
              {integrations.slice(0, 5).map(int => (
                <div key={int.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full ${int.is_active ? 'bg-secondary-400' : 'bg-surface-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 truncate">{int.name || int.provider?.name}</p>
                    <p className="text-xs text-surface-500">{int.provider?.name}</p>
                  </div>
                  {int.last_status && (
                    <span className={`text-xs flex items-center gap-1 ${int.last_status === 'success' ? 'text-secondary-400' : 'text-red-400'}`}>
                      {int.last_status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {int.last_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-900 rounded-xl border border-surface-700/50">
          <div className="flex items-center justify-between p-5 border-b border-surface-700/50">
            <h2 className="text-base font-semibold text-surface-100">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <Code2 className="w-10 h-10 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">No projects yet</p>
              <Link to="/projects" className="text-sm text-primary-400 hover:text-primary-300 mt-2 inline-block">
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-700/50">
              {projects.slice(0, 5).map(proj => (
                <div key={proj.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full ${proj.status === 'running' ? 'bg-secondary-400' : proj.status === 'error' ? 'bg-red-400' : 'bg-surface-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 truncate">{proj.name}</p>
                    <p className="text-xs text-surface-500 capitalize">{proj.template}</p>
                  </div>
                  <span className="text-xs text-surface-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(proj.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-900 rounded-xl border border-surface-700/50 lg:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-surface-700/50">
            <h2 className="text-base font-semibold text-surface-100">Execution Log</h2>
            <Link to="/playground" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Playground <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Terminal className="w-10 h-10 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">No executions yet</p>
              <Link to="/playground" className="text-sm text-primary-400 hover:text-primary-300 mt-2 inline-block">
                Try the playground
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-700/50">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-secondary-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 truncate">{log.action}</p>
                    <p className="text-xs text-surface-500">{log.duration_ms}ms / {log.tokens_used} tokens</p>
                  </div>
                  <span className="text-xs text-surface-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
