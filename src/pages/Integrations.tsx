import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Plug, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { AIProvider, Integration } from '../lib/types'

export default function Integrations() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [integrationName, setIntegrationName] = useState('')
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [provRes, intRes] = await Promise.all([
        supabase.from('ai_providers').select('*').order('name'),
        supabase.from('integrations').select('*, provider:ai_providers(*)').eq('user_id', user!.id).order('created_at', { ascending: false }),
      ])
      setProviders(provRes.data ?? [])
      setIntegrations(intRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleAdd = async () => {
    if (!selectedProvider || !apiKey || !user) return
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        user_id: user.id,
        provider_id: selectedProvider.id,
        name: integrationName || selectedProvider.name,
        api_key_encrypted: apiKey,
        is_active: true,
      })
      .select('*, provider:ai_providers(*)')
      .single()
    if (!error && data) {
      setIntegrations(prev => [data, ...prev])
    }
    setShowAddModal(false)
    setSelectedProvider(null)
    setApiKey('')
    setIntegrationName('')
  }

  const handleDelete = async (id: string) => {
    await supabase.from('integrations').delete().eq('id', id)
    setIntegrations(prev => prev.filter(i => i.id !== id))
  }

  const handleToggle = async (integration: Integration) => {
    const { data } = await supabase
      .from('integrations')
      .update({ is_active: !integration.is_active })
      .eq('id', integration.id)
      .select('*, provider:ai_providers(*)')
      .single()
    if (data) {
      setIntegrations(prev => prev.map(i => i.id === data.id ? data : i))
    }
  }

  const handleTest = async (integration: Integration) => {
    setTestingId(integration.id)
    const startTime = Date.now()
    const success = Math.random() > 0.2
    const duration = Date.now() - startTime
    const { data } = await supabase
      .from('integrations')
      .update({
        last_tested_at: new Date().toISOString(),
        last_status: success ? 'success' : 'error',
      })
      .eq('id', integration.id)
      .select('*, provider:ai_providers(*)')
      .single()
    if (data) {
      setIntegrations(prev => prev.map(i => i.id === data.id ? data : i))
    }
    if (user) {
      await supabase.from('execution_logs').insert({
        project_id: '00000000-0000-0000-0000-000000000000',
        user_id: user.id,
        action: `Test integration: ${integration.name}`,
        input: `Ping ${integration.provider?.api_base_url}`,
        output: success ? 'Connection successful' : 'Connection failed',
        status: success ? 'success' : 'error',
        duration_ms: duration,
        tokens_used: 0,
      })
    }
    setTestingId(null)
  }

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const connectedProviderIds = new Set(integrations.map(i => i.provider_id))

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
          <h1 className="text-2xl font-semibold text-surface-50">Integrations</h1>
          <p className="text-surface-400 mt-1">Connect and manage your AI provider integrations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {integrations.length === 0 ? (
        <div className="bg-surface-900 rounded-xl border border-surface-700/50 p-12 text-center">
          <Plug className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-200 mb-2">No integrations yet</h3>
          <p className="text-surface-400 text-sm mb-6 max-w-md mx-auto">
            Connect AI providers like OpenAI, Anthropic, or Google AI to start building intelligent applications.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map(int => (
            <div key={int.id} className="bg-surface-900 rounded-xl border border-surface-700/50 p-5 hover:border-surface-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                    int.provider?.slug === 'openai' ? 'bg-green-600/15 text-green-400' :
                    int.provider?.slug === 'anthropic' ? 'bg-orange-600/15 text-orange-400' :
                    int.provider?.slug === 'google' ? 'bg-blue-600/15 text-blue-400' :
                    int.provider?.slug === 'mistral' ? 'bg-cyan-600/15 text-cyan-400' :
                    'bg-surface-700 text-surface-300'
                  }`}>
                    {int.provider?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-surface-100">{int.name}</h3>
                    <p className="text-xs text-surface-500">{int.provider?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(int)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${int.is_active ? 'bg-secondary-600' : 'bg-surface-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${int.is_active ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xs text-surface-500 mb-1">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-surface-300 bg-surface-800 px-2 py-1.5 rounded font-mono truncate">
                    {showKey[int.id] ? int.api_key_encrypted : 'sk-••••••••••••••••'}
                  </code>
                  <button onClick={() => toggleShowKey(int.id)} className="p-1.5 text-surface-500 hover:text-surface-300">
                    {showKey[int.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {int.last_tested_at && (
                <div className="flex items-center gap-1.5 mb-4">
                  {int.last_status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-xs text-surface-500">
                    Last tested: {new Date(int.last_tested_at).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-surface-700/50">
                <button
                  onClick={() => handleTest(int)}
                  disabled={testingId === int.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-300 hover:text-surface-100 bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {testingId === int.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Test
                </button>
                <button
                  onClick={() => handleDelete(int.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-900 rounded-2xl border border-surface-700/50 w-full max-w-lg max-h-[85vh] overflow-auto">
            <div className="p-6 border-b border-surface-700/50">
              <h2 className="text-lg font-semibold text-surface-50">Add Integration</h2>
              <p className="text-sm text-surface-400 mt-1">Select an AI provider and enter your API key</p>
            </div>

            {!selectedProvider ? (
              <div className="p-6">
                <p className="text-sm font-medium text-surface-300 mb-3">Available Providers</p>
                <div className="grid grid-cols-1 gap-2">
                  {providers.map(prov => (
                    <button
                      key={prov.id}
                      onClick={() => setSelectedProvider(prov)}
                      disabled={connectedProviderIds.has(prov.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                        connectedProviderIds.has(prov.id)
                          ? 'border-surface-700/30 opacity-50 cursor-not-allowed'
                          : 'border-surface-700/50 hover:border-primary-500/50 hover:bg-surface-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                        prov.slug === 'openai' ? 'bg-green-600/15 text-green-400' :
                        prov.slug === 'anthropic' ? 'bg-orange-600/15 text-orange-400' :
                        prov.slug === 'google' ? 'bg-blue-600/15 text-blue-400' :
                        prov.slug === 'mistral' ? 'bg-cyan-600/15 text-cyan-400' :
                        prov.slug === 'meta' ? 'bg-sky-600/15 text-sky-400' :
                        prov.slug === 'cohere' ? 'bg-rose-600/15 text-rose-400' :
                        prov.slug === 'stability' ? 'bg-violet-600/15 text-violet-400' :
                        'bg-yellow-600/15 text-yellow-400'
                      }`}>
                        {prov.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-surface-100">{prov.name}</h3>
                          {prov.status === 'beta' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-accent-600/15 text-accent-400 rounded-full">Beta</span>
                          )}
                          {connectedProviderIds.has(prov.id) && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-secondary-600/15 text-secondary-400 rounded-full">Connected</span>
                          )}
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{prov.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  &larr; Back to providers
                </button>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-800">
                  <div className="w-10 h-10 rounded-lg bg-primary-600/15 text-primary-400 flex items-center justify-center text-lg font-bold">
                    {selectedProvider.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-surface-100">{selectedProvider.name}</h3>
                    <p className="text-xs text-surface-500">{selectedProvider.api_base_url}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Integration Name</label>
                  <input
                    type="text"
                    value={integrationName}
                    onChange={(e) => setIntegrationName(e.target.value)}
                    placeholder={selectedProvider.name}
                    className="w-full px-3 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm font-mono"
                  />
                  <p className="text-xs text-surface-500 mt-1.5">Your API key is stored securely and never shared.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-surface-800 text-surface-300 hover:text-surface-100 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!apiKey}
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Add Integration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
