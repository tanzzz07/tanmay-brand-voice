import type {
  Action,
  ContentResponse,
  DualDraftFormState,
  DualDraftResponse,
  FormState,
  SampleItem,
  SubmissionPackResponse,
  VoiceProfileResponse,
} from '../types'

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:8000'
    : '')


export async function createContent(
  action: Action,
  form: FormState,
  instruction?: string
): Promise<ContentResponse> {
  const response = await fetch(`${BASE_URL}/api/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...form,
      input: form.input,
      ...(instruction ? { instruction } : {}),
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Something went wrong')
  return data
}

export async function generateDualDraft(form: DualDraftFormState): Promise<DualDraftResponse> {
  const response = await fetch(`${BASE_URL}/api/dual-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to generate dual drafts')
  return data
}

export async function getVoiceProfile(): Promise<VoiceProfileResponse> {
  const response = await fetch(`${BASE_URL}/api/voice-profile`)
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to load voice profile')
  return data
}

export async function updateVoiceProfile(core: any): Promise<VoiceProfileResponse> {
  const response = await fetch(`${BASE_URL}/api/voice-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ core }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to update voice profile')
  return data
}

export async function fixDriftInGuide(pattern: string, note?: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/fix-drift-in-guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forbidden_pattern: pattern, rule_note: note }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to apply drift fix')
  return data
}

export async function addVoiceSample(title: string, content: string): Promise<SampleItem> {
  const response = await fetch(`${BASE_URL}/api/samples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to add sample')
  return data.sample
}

export async function generateSubmissionPack(params: {
  core_topic: string
  draft_a_content?: string
  draft_a_format?: string
  draft_b_content?: string
  draft_b_format?: string
  final_post_content?: string
  final_post_format?: string
  drift_notes?: string
}): Promise<SubmissionPackResponse> {
  const response = await fetch(`${BASE_URL}/api/submission-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to compile submission pack')
  return data
}

