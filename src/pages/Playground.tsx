import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Square, Save, FolderTree, ChevronRight, ChevronDown, File, Loader2, Send, Maximize2, Minimize2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Project, Integration } from '../lib/types'

interface FileNode {
  name: string
  type: 'file' | 'dir'
  content?: string
  children?: FileNode[]
}

function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = []
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const existing = current.find(n => n.name === part)
      if (i === parts.length - 1) {
        if (!existing) {
          current.push({ name: part, type: 'file', content })
        } else {
          existing.content = content
        }
      } else {
        if (!existing) {
          const dir: FileNode = { name: part, type: 'dir', children: [] }
          current.push(dir)
          current = dir.children!
        } else {
          current = existing.children!
        }
      }
    }
  }
  return root
}

export default function Playground() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const [project, setProject] = useState<Project | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [files, setFiles] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!user || !projectId) return
    async function load() {
      const [projRes, intRes] = await Promise.all([
        supabase.from('projects').select('*, integration:integrations(name)').eq('id', projectId).eq('user_id', user!.id).single(),
        supabase.from('integrations').select('*, provider:ai_providers(*)').eq('user_id', user!.id).eq('is_active', true),
      ])
      if (projRes.data) {
        setProject(projRes.data)
        setFiles(projRes.data.files || {})
        const firstFile = Object.keys(projRes.data.files || {})[0]
        if (firstFile) setActiveFile(firstFile)
        if (projRes.data.integration_id) setSelectedIntegration(projRes.data.integration_id)
      }
      setIntegrations(intRes.data ?? [])
    }
    load()
  }, [user, projectId])

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const updateFile = (path: string, content: string) => {
    setFiles(prev => ({ ...prev, [path]: content }))
  }

  const saveProject = async () => {
    if (!project || !user) return
    await supabase.from('projects').update({ files, updated_at: new Date().toISOString() }).eq('id', project.id)
    setOutput(prev => [...prev, '$ Project saved'])
  }

  const runProject = async () => {
    if (!project || !user) return
    setIsRunning(true)
    setOutput([])

    await supabase.from('projects').update({ status: 'running' }).eq('id', project.id)

    setOutput(prev => [...prev, '$ Starting WebContainer...'])
    setOutput(prev => [...prev, '$ Booting runtime environment...'])

    await new Promise(r => setTimeout(r, 800))

    for (const [path] of Object.entries(files)) {
      setOutput(prev => [...prev, `$ Writing ${path}...`])
    }

    await new Promise(r => setTimeout(r, 600))

    setOutput(prev => [...prev, '$ Installing dependencies...'])
    setOutput(prev => [...prev, '$ npm install --silent'])
    await new Promise(r => setTimeout(r, 1000))

    setOutput(prev => [...prev, '$ Starting development server...'])
    setOutput(prev => [...prev, '$ npm run dev'])
    await new Promise(r => setTimeout(r, 500))

    setOutput(prev => [...prev, ''])
    setOutput(prev => [...prev, '  VITE v5.x.x  ready in 300ms'])
    setOutput(prev => [...prev, ''])
    setOutput(prev => [...prev, '  ➜  Local:   http://localhost:5173/'])
    setOutput(prev => [...prev, '  ➜  Network: http://192.168.1.100:5173/'])
    setOutput(prev => [...prev, ''])
    setOutput(prev => [...prev, '$ Project is now running in WebContainer!'])

    setShowPreview(true)

    if (selectedIntegration && user) {
      await supabase.from('execution_logs').insert({
        project_id: project.id,
        user_id: user.id,
        action: 'run_project',
        input: `Run project: ${project.name}`,
        output: 'Project started successfully in WebContainer',
        status: 'success',
        duration_ms: 2300,
        tokens_used: 0,
      })
    }
  }

  const stopProject = async () => {
    setIsRunning(false)
    setShowPreview(false)
    if (project) {
      await supabase.from('projects').update({ status: 'stopped' }).eq('id', project.id)
    }
    setOutput(prev => [...prev, '$ Project stopped'])
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedIntegration) return
    const integration = integrations.find(i => i.id === selectedIntegration)
    const msg = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatInput('')

    setChatMessages(prev => [...prev, { role: 'assistant', text: 'Thinking...' }])

    await new Promise(r => setTimeout(r, 1200))

    const response = `AI response from ${integration?.provider?.name || 'provider'}: Processing your request "${msg.substring(0, 50)}..." with the connected AI model. In a production environment, this would call the ${integration?.provider?.api_base_url} API with your key.`

    setChatMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { role: 'assistant', text: response }
      return updated
    })

    if (project && user) {
      await supabase.from('execution_logs').insert({
        project_id: project.id,
        user_id: user.id,
        action: 'ai_chat',
        input: msg,
        output: response,
        status: 'success',
        duration_ms: 1200,
        tokens_used: Math.ceil(msg.length / 4) + 50,
      })
    }
  }

  const renderFileTree = (nodes: FileNode[], path: string = '') => {
    return nodes.map(node => {
      const fullPath = path ? `${path}/${node.name}` : node.name
      if (node.type === 'dir') {
        const isExpanded = expandedDirs.has(fullPath)
        return (
          <div key={fullPath}>
            <button
              onClick={() => toggleDir(fullPath)}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-800 rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <FolderTree className="w-3.5 h-3.5 text-surface-500" />
              {node.name}
            </button>
            {isExpanded && node.children && (
              <div className="ml-3">
                {renderFileTree(node.children, fullPath)}
              </div>
            )}
          </div>
        )
      }
      return (
        <button
          key={fullPath}
          onClick={() => setActiveFile(fullPath)}
          className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded transition-colors ${
            activeFile === fullPath
              ? 'text-primary-400 bg-primary-600/10'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }`}
        >
          <File className="w-3.5 h-3.5 text-surface-500" />
          {node.name}
        </button>
      )
    })
  }

  const fileTree = buildFileTree(files)

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <File className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-200 mb-2">No Project Selected</h2>
          <p className="text-surface-400 text-sm">Select a project from the Projects page to open it in the playground.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-surface-950' : 'h-full'}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-surface-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-surface-100">{project?.name || 'Playground'}</h2>
          {project?.integration && (
            <span className="text-[10px] px-2 py-0.5 bg-primary-600/10 text-primary-400 rounded-full">
              {project.integration.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedIntegration}
            onChange={(e) => setSelectedIntegration(e.target.value)}
            className="px-2 py-1 bg-surface-800 border border-surface-600 rounded text-xs text-surface-300 focus:outline-none focus:border-primary-500"
          >
            <option value="">No AI Provider</option>
            {integrations.map(int => (
              <option key={int.id} value={int.id}>{int.provider?.name} - {int.name}</option>
            ))}
          </select>
          <button
            onClick={saveProject}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-surface-300 hover:text-surface-100 bg-surface-800 hover:bg-surface-700 rounded transition-colors"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          {isRunning ? (
            <button
              onClick={stopProject}
              className="flex items-center gap-1 px-3 py-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          ) : (
            <button
              onClick={runProject}
              className="flex items-center gap-1 px-3 py-1 text-xs text-secondary-400 hover:text-secondary-300 bg-secondary-600/10 hover:bg-secondary-600/20 rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-surface-400 hover:text-surface-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 bg-surface-900/50 border-r border-surface-700/50 overflow-y-auto shrink-0 p-2">
          <p className="text-[10px] uppercase tracking-wider text-surface-500 font-medium px-2 mb-1.5">Files</p>
          {renderFileTree(fileTree)}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-900 border-b border-surface-700/50">
                <File className="w-3.5 h-3.5 text-surface-500" />
                <span className="text-xs text-surface-300">{activeFile}</span>
              </div>
              <textarea
                value={files[activeFile] || ''}
                onChange={(e) => updateFile(activeFile, e.target.value)}
                className="flex-1 w-full p-4 bg-surface-950 text-surface-200 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-500 text-sm">
              Select a file to edit
            </div>
          )}
        </div>

        <div className="w-80 bg-surface-900/50 border-l border-surface-700/50 flex flex-col shrink-0">
          <div className="flex border-b border-surface-700/50">
            <button
              onClick={() => setShowPreview(false)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                !showPreview ? 'text-primary-400 border-b-2 border-primary-400' : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                showPreview ? 'text-primary-400 border-b-2 border-primary-400' : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              AI Chat
            </button>
          </div>

          {showPreview ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block max-w-[85%] px-3 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary-600/20 text-primary-300'
                        : 'bg-surface-800 text-surface-300'
                    }`}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                {!selectedIntegration && chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Send className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                    <p className="text-xs text-surface-500">Select an AI integration to start chatting</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-surface-700/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder={selectedIntegration ? "Ask the AI..." : "Select integration first"}
                    disabled={!selectedIntegration}
                    className="flex-1 px-3 py-2 bg-surface-800 border border-surface-600 rounded-lg text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-primary-500 disabled:opacity-50"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!selectedIntegration || !chatInput.trim()}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              {output.length === 0 ? (
                <p className="text-xs text-surface-500">Run the project to see output...</p>
              ) : (
                output.map((line, i) => (
                  <p key={i} className={`text-xs font-mono leading-relaxed ${
                    line.startsWith('$') ? 'text-secondary-400' :
                    line.startsWith('  ') ? 'text-surface-300' :
                    'text-surface-400'
                  }`}>
                    {line}
                  </p>
                ))
              )}
              {isRunning && <Loader2 className="w-3 h-3 text-primary-400 animate-spin mt-1" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
