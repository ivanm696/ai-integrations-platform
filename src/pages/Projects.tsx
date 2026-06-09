import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Code2, Trash2, Play, Square, FileCode, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Project, Integration, ProjectTemplate } from '../lib/types'
import { PROJECT_TEMPLATES } from '../lib/types'

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTemplate, setNewTemplate] = useState<ProjectTemplate>('blank')
  const [newIntegrationId, setNewIntegrationId] = useState<string>('')

  useEffect(() => {
    if (!user) return
    async function load() {
      const [projRes, intRes] = await Promise.all([
        supabase.from('projects').select('*, integration:integrations(name)').eq('user_id', user!.id).order('updated_at', { ascending: false }),
        supabase.from('integrations').select('*, provider:ai_providers(*)').eq('user_id', user!.id).eq('is_active', true),
      ])
      setProjects(projRes.data ?? [])
      setIntegrations(intRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleCreate = async () => {
    if (!user || !newName) return
    const template = PROJECT_TEMPLATES[newTemplate]
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: newName,
        description: newDesc,
        template: newTemplate,
        files: template.defaultFiles,
        integration_id: newIntegrationId || null,
        status: 'draft',
      })
      .select('*, integration:integrations(name)')
      .single()
    if (!error && data) {
      setProjects(prev => [data, ...prev])
    }
    setShowCreateModal(false)
    setNewName('')
    setNewDesc('')
    setNewTemplate('blank')
    setNewIntegrationId('')
  }

  const handleDelete = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const handleToggleStatus = async (project: Project) => {
    const newStatus = project.status === 'running' ? 'stopped' : 'running'
    const { data } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id)
      .select('*, integration:integrations(name)')
      .single()
    if (data) {
      setProjects(prev => prev.map(p => p.id === data.id ? data : p))
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-surface-600',
    running: 'bg-secondary-400',
    stopped: 'bg-surface-600',
    error: 'bg-red-400',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-surface-50">Projects</h1>
          <p className="text-surface-400 mt-1">Create and manage WebContainer projects with AI integration</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-surface-900 rounded-xl border border-surface-700/50 p-12 text-center">
          <Code2 className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-200 mb-2">No projects yet</h3>
          <p className="text-surface-400 text-sm mb-6 max-w-md mx-auto">
            Create your first project to start building with WebContainer and AI.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-surface-900 rounded-xl border border-surface-700/50 p-5 hover:border-surface-600 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-surface-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-surface-100">{project.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusColors[project.status] || 'bg-surface-600'}`} />
                      <span className="text-xs text-surface-500 capitalize">{project.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {project.description && (
                <p className="text-xs text-surface-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-surface-500 mb-4">
                <span className="px-2 py-1 bg-surface-800 rounded capitalize">{project.template}</span>
                <span>{Object.keys(project.files || {}).length} files</span>
                {project.integration && (
                  <span className="px-2 py-1 bg-primary-600/10 text-primary-400 rounded">{project.integration.name}</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-surface-700/50">
                <Link
                  to={`/playground?project=${project.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-400 hover:text-primary-300 bg-primary-600/10 hover:bg-primary-600/20 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  Open
                </Link>
                <button
                  onClick={() => handleToggleStatus(project)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    project.status === 'running'
                      ? 'text-surface-400 hover:text-surface-200 bg-surface-800'
                      : 'text-secondary-400 hover:text-secondary-300 bg-secondary-600/10'
                  }`}
                >
                  {project.status === 'running' ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {project.status === 'running' ? 'Stop' : 'Run'}
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-900 rounded-2xl border border-surface-700/50 w-full max-w-lg max-h-[85vh] overflow-auto">
            <div className="p-6 border-b border-surface-700/50">
              <h2 className="text-lg font-semibold text-surface-50">New Project</h2>
              <p className="text-sm text-surface-400 mt-1">Create a WebContainer project with AI integration</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My AI Project"
                  className="w-full px-3 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does this project do?"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-3">Template</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.entries(PROJECT_TEMPLATES) as [ProjectTemplate, typeof PROJECT_TEMPLATES[ProjectTemplate]][]).map(([key, tmpl]) => (
                    <button
                      key={key}
                      onClick={() => setNewTemplate(key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        newTemplate === key
                          ? 'border-primary-500/50 bg-primary-600/10'
                          : 'border-surface-700/50 hover:border-surface-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        newTemplate === key ? 'bg-primary-600/20 text-primary-400' : 'bg-surface-800 text-surface-400'
                      }`}>
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-surface-100">{tmpl.label}</h4>
                        <p className="text-xs text-surface-500">{tmpl.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">AI Integration</label>
                <select
                  value={newIntegrationId}
                  onChange={(e) => setNewIntegrationId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                >
                  <option value="">No integration</option>
                  {integrations.map(int => (
                    <option key={int.id} value={int.id}>{int.name} ({int.provider?.name})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-surface-800 text-surface-300 hover:text-surface-100 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
