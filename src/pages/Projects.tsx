import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Project } from '../lib/types'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const { data, error: supabaseError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (supabaseError) {
          throw supabaseError
        }

        if (data) {
          setProjects(data)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Твоя строка обработки ошибок теперь находится на своем месте внутри компонента
  if (error) { 
    console.error(error) 
  }

  return (
    <div className="p-6 text-white min-h-screen bg-surface-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Проекты</h1>
          <p className="text-sm text-surface-400">Управляйте вашими AI проектами и шаблонами</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">
          Создать проект
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg text-red-400 text-sm">
          Не удалось загрузить список проектов. Ошибка выведена в консоль.
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-surface-800 rounded-xl bg-surface-900/50">
          <p className="text-surface-400 text-sm">У вас пока нет созданных проектов.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="p-5 border border-surface-800 bg-surface-900 rounded-xl hover:border-surface-700 transition-all"
            >
              <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
              <p className="text-sm text-surface-400 line-clamp-2">{project.description || 'Без описания'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
      }
