import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Pause, Play, Save, ShieldAlert } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useAppData } from '../hooks/useAppData'
import type { BrandTone } from '../types'

const tones: BrandTone[] = ['Helpful', 'Premium', 'Warm', 'Bold', 'Minimal']

export function Settings() {
  const { settings, saveSettings } = useAppData()
  const [form, setForm] = useState(settings)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus(null)
    await saveSettings(form)
    setStatus('Settings saved.')
  }

  return (
    <>
      <PageHeader title="Settings" eyebrow="Brand controls" />
      <Card className="max-w-3xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field label="Global Pin Instructions">
            <textarea className="input min-h-28" value={form.global_pin_instructions} onChange={(event) => setForm({ ...form, global_pin_instructions: event.target.value })} />
          </Field>
          <Field label="Brand tone">
            <select className="input" value={form.brand_tone} onChange={(event) => setForm({ ...form, brand_tone: event.target.value as BrandTone })}>
              {tones.map((tone) => <option key={tone}>{tone}</option>)}
            </select>
          </Field>
          <Field label="CTA preferences">
            <input className="input" value={form.cta_preferences} onChange={(event) => setForm({ ...form, cta_preferences: event.target.value })} />
          </Field>
          <Field label="Visual style preferences">
            <textarea className="input min-h-24" value={form.visual_style_preferences} onChange={(event) => setForm({ ...form, visual_style_preferences: event.target.value })} />
          </Field>
          <Field label="Content guidelines">
            <textarea className="input min-h-24" value={form.content_guidelines} onChange={(event) => setForm({ ...form, content_guidelines: event.target.value })} />
          </Field>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <h2 className="font-semibold">Automation Rules</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Automation remains optional and requires the AUTO_PUBLISH feature flag plus a connected Pinterest account.</p>
            <label className="mt-4 flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={Boolean(form.auto_publish_enabled)} onChange={(event) => setForm({ ...form, auto_publish_enabled: event.target.checked })} />
              Auto Publish Enabled
            </label>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Max Pins Per Day">
                <input className="input" type="number" min={1} max={50} value={form.max_pins_per_day ?? 5} onChange={(event) => setForm({ ...form, max_pins_per_day: Number(event.target.value) })} />
              </Field>
              <Field label="Retry Limits">
                <input className="input" type="number" min={0} max={10} value={form.retry_limits ?? 2} onChange={(event) => setForm({ ...form, retry_limits: Number(event.target.value) })} />
              </Field>
              <Field label="Publishing Delay Minutes">
                <input className="input" type="number" min={0} max={240} value={form.publishing_delay_minutes ?? 15} onChange={(event) => setForm({ ...form, publishing_delay_minutes: Number(event.target.value) })} />
              </Field>
              <Field label="Queue Priority">
                <select className="input" value={form.queue_priority ?? 'Oldest First'} onChange={(event) => setForm({ ...form, queue_priority: event.target.value as typeof form.queue_priority })}>
                  <option>Oldest First</option>
                  <option>Newest First</option>
                  <option>Highest Affiliate Potential</option>
                </select>
              </Field>
            </div>
            <Field label="Upload Time Windows">
              <input className="input" value={form.upload_time_windows ?? ''} onChange={(event) => setForm({ ...form, upload_time_windows: event.target.value })} placeholder="09:00-11:00, 16:00-18:00" />
            </Field>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" type="button" onClick={() => setForm({ ...form, automation_paused: true })}><Pause size={16} />Pause</button>
              <button className="btn-secondary" type="button" onClick={() => setForm({ ...form, automation_paused: false, emergency_stop: false })}><Play size={16} />Resume</button>
              <button className="btn-secondary" type="button" onClick={() => setForm({ ...form, emergency_stop: true, automation_paused: true })}><ShieldAlert size={16} />Emergency stop</button>
            </div>
          </div>
          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          <button className="btn-primary" type="submit">
            <Save size={16} />
            Save settings
          </button>
        </form>
      </Card>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
