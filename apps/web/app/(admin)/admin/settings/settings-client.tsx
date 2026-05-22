'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Settings, Cpu, Globe, Flag, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface SettingItem {
  key: string
  label: string
  description?: string
  type: 'text' | 'boolean' | 'url'
}

const SETTING_GROUPS: { title: string; icon: React.ComponentType<{className?: string}>; items: SettingItem[] }[] = [
  {
    title: 'General',
    icon: Settings,
    items: [
      { key: 'app_name', label: 'App Name', type: 'text' },
      { key: 'device_name', label: 'Device Name', type: 'text', description: 'Shown to users on the home screen' },
    ],
  },
  {
    title: 'AI / Models',
    icon: Cpu,
    items: [
      { key: 'ollama_url', label: 'Ollama URL', type: 'url', description: 'Local Ollama server endpoint' },
      { key: 'chat_model', label: 'Default Chat Model', type: 'text', description: 'e.g. gemma3:1b, phi3:mini' },
      { key: 'embedding_model', label: 'Embedding Model', type: 'text', description: 'e.g. nomic-embed-text' },
      { key: 'ai_service_url', label: 'AI Service URL', type: 'url', description: 'FastAPI AI orchestration service' },
    ],
  },
  {
    title: 'Kolibri',
    icon: Globe,
    items: [
      { key: 'kolibri_url', label: 'Kolibri URL', type: 'url', description: 'Kolibri server address on local network' },
    ],
  },
  {
    title: 'Feature Flags',
    icon: Flag,
    items: [
      { key: 'feature_rag', label: 'RAG Search', type: 'boolean', description: 'Enable RAG-powered document search in chat' },
      { key: 'feature_knowledge', label: 'Knowledge Base', type: 'boolean', description: 'Show knowledge base section to users' },
      { key: 'feature_learn', label: 'Learn Section', type: 'boolean', description: 'Show Kolibri/Learn section to users' },
      { key: 'classroom_mode', label: 'Classroom Mode', type: 'boolean', description: 'Restrict features for classroom use' },
      { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'boolean', description: 'Show maintenance page to all users' },
    ],
  },
]

export function SettingsClient() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => setSettings(data.settings ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }))
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Configure ASKAI platform behavior
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={saving}>
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        {SETTING_GROUPS.map((group, gi) => {
          const Icon = group.icon
          return (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.08 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.key}>
                        <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1">
                          {item.label}
                        </label>
                        {item.description && (
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-1.5">
                            {item.description}
                          </p>
                        )}
                        {item.type === 'boolean' ? (
                          <button
                            onClick={() => handleToggle(item.key)}
                            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                              settings[item.key] === 'true'
                                ? 'bg-[hsl(var(--accent))]'
                                : 'bg-[hsl(var(--muted))]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                                settings[item.key] === 'true' ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        ) : (
                          <Input
                            type={item.type === 'url' ? 'url' : 'text'}
                            value={settings[item.key] ?? ''}
                            onChange={(e) => handleChange(item.key, e.target.value)}
                            placeholder={item.type === 'url' ? 'http://localhost:...' : ''}
                          />
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3">
        <AlertCircle className="h-4 w-4 text-[hsl(var(--muted-foreground))] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Some settings require a server restart to take effect. Network and model configuration
          changes may need Ollama to be restarted separately.
        </p>
      </div>
    </div>
  )
}
