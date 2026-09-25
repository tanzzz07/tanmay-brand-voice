import { useState, useEffect } from 'react'
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  FileText,
  Layers,
  Send,
  Download,
  BookOpen,
  Plus,
  Compass,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Cpu,
  Feather,
  MessageSquare
} from 'lucide-react'
import {
  createContent,
  generateDualDraft,
  getVoiceProfile,
  updateVoiceProfile,
  fixDriftInGuide,
  addVoiceSample,
  generateSubmissionPack
} from './services/api'
import type {
  Action,
  Audience,
  DualDraftFormState,
  DualDraftResponse,
  FormState,
  FormatType,
  Length,
  Mode,
  SampleItem,
  SubmissionPackResponse,
  VoiceProfileResponse,
  EvaluationResult
} from './types'

type ActiveTab = 'dual' | 'drift' | 'studio' | 'single' | 'submission'

const FORMAT_OPTIONS: { id: FormatType; label: string; icon: string; desc: string }[] = [
  { id: 'social_post', label: 'Social Post', icon: '📱', desc: 'Punchy, conversational, authentic feed post' },
  { id: 'email', label: 'Work Email / Memo', icon: '✉️', desc: 'Direct, clear, respectful & human' },
  { id: 'linkedin_post', label: 'LinkedIn Article / Post', icon: '💼', desc: 'Practical insight with a strong hook' },
  { id: 'slack_message', label: 'Slack / Team Chat', icon: '💬', desc: 'Quick, collaborative team update' },
  { id: 'ad_copy', label: 'Authentic Ad / Value Prop', icon: '🎯', desc: 'High-trust, zero-hype messaging' },
  { id: 'technical_breakdown', label: 'Technical Breakdown', icon: '⚙️', desc: 'Focuses on why decisions were made' },
  { id: 'video_script', label: 'Video / Spoken Script', icon: '🎙️', desc: 'Spoken rhythm and conversational cadence' },
  { id: 'tweet_thread', label: 'Twitter / X Thread', icon: '🧵', desc: 'Bite-sized, crisp thoughts' },
]

const MODE_OPTIONS: { id: Mode; label: string; note: string; color: string }[] = [
  { id: 'casual', label: 'Casual', note: 'Relaxed & conversational', color: '#84cc16' },
  { id: 'professional', label: 'Professional', note: 'Clear & respectful', color: '#38bdf8' },
  { id: 'technical', label: 'Technical', note: 'Precise & practical', color: '#a855f7' },
  { id: 'spoken', label: 'Spoken', note: 'Natural spoken cadence', color: '#f59e0b' },
]

const AUDIENCE_OPTIONS: { id: Audience; label: string }[] = [
  { id: 'general', label: 'General Audience' },
  { id: 'recruiter', label: 'Recruiters & Hiring Managers' },
  { id: 'technical', label: 'Engineers & Technical Leads' },
  { id: 'friend', label: 'Peers & Friends' },
  { id: 'client', label: 'Clients & Stakeholders' },
]

const QUICK_PROMPTS = [
  {
    title: 'Productivity vs Busyness',
    text: 'I noticed that being busy all day on small tasks does not equal real productivity. Focusing on 1-2 core priorities with a calm routine creates far better results than chaotic multitasking.'
  },
  {
    title: 'Failure as a Learning Loop',
    text: 'Building something great takes much more time and small failures than people show online. When things go wrong, stepping back, finding what failed, and restarting the next day is what really works.'
  },
  {
    title: 'Simplifying Our Tech Stack',
    text: 'We decided to remove 3 redundant microservices and replace them with a clean modular pipeline. It cut our latency by 45% and made debugging 10x easier for the team.'
  },
  {
    title: 'Morning Routine & Screen Detox',
    text: 'Starting the day with water and a walk outside without checking phone notifications immediately makes the entire day feel less rushed and more focused.'
  }
]

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [toast, setToast] = useState<string>('')

  // Voice Profile State
  const [profile, setProfile] = useState<VoiceProfileResponse | null>(null)
  const [newTaboo, setNewTaboo] = useState('')

  // New Sample Modal / Form
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [sampleTitle, setSampleTitle] = useState('')
  const [sampleContent, setSampleContent] = useState('')

  // Single Generator State
  const [singleForm, setSingleForm] = useState<FormState>({
    input: '',
    mode: 'casual',
    audience: 'general',
    length: 'medium',
    context: '',
    format_type: 'social_post',
  })
  const [singleOutput, setSingleOutput] = useState('')
  const [singleEval, setSingleEval] = useState<EvaluationResult | null>(null)
  const [singleCopied, setSingleCopied] = useState(false)

  // Dual-Draft Generator State (Step II of Mission)
  const [dualForm, setDualForm] = useState<DualDraftFormState>({
    input: QUICK_PROMPTS[0].text,
    format_a: 'email',
    mode_a: 'professional',
    audience_a: 'recruiter',
    format_b: 'social_post',
    mode_b: 'casual',
    audience_b: 'general',
    length: 'medium',
    context: 'Sharing lessons from recent project workflow reorganization',
  })
  const [dualResponse, setDualResponse] = useState<DualDraftResponse | null>(null)
  const [copiedDraftA, setCopiedDraftA] = useState(false)
  const [copiedDraftB, setCopiedDraftB] = useState(false)

  // Drift Auditor State
  const [driftInput, setDriftInput] = useState<string>('')
  const [driftMode, setDriftMode] = useState<Mode>('casual')
  const [driftAudience, setDriftAudience] = useState<Audience>('general')
  const [driftEval, setDriftEval] = useState<EvaluationResult | null>(null)
  const [fixingDrift, setFixingDrift] = useState(false)

  // Submission Pack State
  const [submissionPack, setSubmissionPack] = useState<SubmissionPackResponse | null>(null)
  const [subCopied, setSubCopied] = useState(false)
  const [instructionsCopied, setInstructionsCopied] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Load Voice Profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await getVoiceProfile()
      setProfile(data)
    } catch (e) {
      console.warn('Using local fallback profile', e)
    }
  }

  // Handle Dual Draft Generation
  const handleDualGenerate = async () => {
    if (!dualForm.input.trim()) {
      setError('Please provide a topic or draft message.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await generateDualDraft(dualForm)
      setDualResponse(res)
      showToast('Dual drafts generated & evaluated successfully!')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dual draft generation failed.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Single Content Generation / Refinement
  const handleSingleRun = async (action: Action, instruction?: string) => {
    if (!singleForm.input.trim()) {
      setError('Please enter a draft or prompt.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await createContent(action, singleForm, instruction)
      setSingleOutput(res.content)
      setSingleEval(res.evaluation || null)
      showToast(`Content ${action === 'generate' ? 'generated' : 'refined'} successfully!`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  // Send draft to Drift Auditor
  const sendToDriftAuditor = (content: string, mode: Mode, evalRes?: EvaluationResult) => {
    setDriftInput(content)
    setDriftMode(mode)
    if (evalRes) {
      setDriftEval(evalRes)
    }
    setActiveTab('drift')
    showToast('Transferred draft to Drift Auditor!')
  }

  // Run Drift Analysis
  const handleRunDriftAudit = async () => {
    if (!driftInput.trim()) {
      setError('Please enter text to evaluate.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: driftInput,
          mode: driftMode,
          audience: driftAudience
        })
      })
      const data = await res.json()
      setDriftEval(data)
      showToast('Linguistic drift audit complete!')
    } catch (e) {
      setError('Evaluation failed.')
    } finally {
      setLoading(false)
    }
  }

  // Fix Drift in Guide (1-Click)
  const handleFixDriftInGuide = async (phrase: string) => {
    setFixingDrift(true)
    try {
      await fixDriftInGuide(phrase, `Never use corporate phrase '${phrase}'. Maintain direct, grounded tone.`)
      await loadProfile()
      showToast(`Added "${phrase}" to forbidden guide rules!`)
      // re-audit
      if (driftInput) {
        handleRunDriftAudit()
      }
    } catch (e) {
      setError('Failed to update guide.')
    } finally {
      setFixingDrift(false)
    }
  }

  // Add custom forbidden phrase
  const handleAddForbiddenPhrase = async () => {
    if (!newTaboo.trim()) return
    try {
      await fixDriftInGuide(newTaboo.trim())
      setNewTaboo('')
      await loadProfile()
      showToast('New taboo rule added to guide!')
    } catch (e) {
      setError('Failed to add taboo.')
    }
  }

  // Add new voice sample
  const handleAddSample = async () => {
    if (!sampleTitle.trim() || !sampleContent.trim()) return
    setLoading(true)
    try {
      await addVoiceSample(sampleTitle.trim(), sampleContent.trim())
      setSampleTitle('')
      setSampleContent('')
      setShowSampleModal(false)
      await loadProfile()
      showToast('New authoritative writing sample added!')
    } catch (e) {
      setError('Failed to save sample.')
    } finally {
      setLoading(false)
    }
  }

  // Generate Mission Submission Pack
  const handleCompileSubmissionPack = async () => {
    setLoading(true)
    setError('')
    try {
      const pack = await generateSubmissionPack({
        core_topic: dualForm.input,
        draft_a_content: dualResponse?.draft_a.content,
        draft_a_format: `Format A (${FORMAT_OPTIONS.find(f => f.id === dualForm.format_a)?.label || 'Email'})`,
        draft_b_content: dualResponse?.draft_b.content,
        draft_b_format: `Format B (${FORMAT_OPTIONS.find(f => f.id === dualForm.format_b)?.label || 'Social Post'})`,
        final_post_content: singleOutput || dualResponse?.draft_b.content,
        final_post_format: 'Real Post / Social Publication',
        drift_notes: 'Audited drafts for AI buzzwords and robotic rhythm. Integrated negative constraints to prevent corporate jargon and enforce authentic qualifiers.'
      })
      setSubmissionPack(pack)
      setActiveTab('submission')
      showToast('Handshake Mission Submission Pack compiled!')
    } catch (e) {
      setError('Failed to compile submission pack.')
    } finally {
      setLoading(false)
    }
  }

  // Copy helpers
  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Downloaded ${filename}`)
  }

  return (
    <div className="brand-voice-app">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="brand-header">
        <div className="header-container">
          <div className="brand-badge-group">
            <div className="brand-avatar">T</div>
            <div>
              <div className="brand-title">TANMAY</div>
              <div className="brand-subtitle">BRAND VOICE GENERATOR & AUDITOR</div>
            </div>
          </div>

          <div className="mission-pill-wrapper">
            <span className="mission-tag">HANDSHAKE MISSION READY</span>
            <div className="engine-status">
              <span className="pulsing-green-dot" />
              <span>Personal Voice Engine Active</span>
            </div>
          </div>
        </div>

        {/* Mission Progression Bar */}
        <div className="mission-stepper">
          <div className="stepper-track">
            <div className={`step-item ${activeTab === 'studio' ? 'active' : 'completed'}`} onClick={() => setActiveTab('studio')}>
              <span className="step-num">I</span>
              <div className="step-text">
                <strong>Voice Guide & Samples</strong>
                <small>Authoritative reference & rules</small>
              </div>
            </div>
            <ChevronRight size={14} className="stepper-arrow" />

            <div className={`step-item ${activeTab === 'dual' ? 'active' : (dualResponse ? 'completed' : '')}`} onClick={() => setActiveTab('dual')}>
              <span className="step-num">II</span>
              <div className="step-text">
                <strong>Dual-Format Drafter</strong>
                <small>Same message in 2 formats</small>
              </div>
            </div>
            <ChevronRight size={14} className="stepper-arrow" />

            <div className={`step-item ${activeTab === 'drift' ? 'active' : (driftEval ? 'completed' : '')}`} onClick={() => setActiveTab('drift')}>
              <span className="step-num">III</span>
              <div className="step-text">
                <strong>Drift Detector & Fixer</strong>
                <small>Audit & patch guide rules</small>
              </div>
            </div>
            <ChevronRight size={14} className="stepper-arrow" />

            <div className={`step-item ${activeTab === 'submission' ? 'active' : ''}`} onClick={() => setActiveTab('submission')}>
              <span className="step-num">IV</span>
              <div className="step-text">
                <strong>Mission Submission Pack</strong>
                <small>Export completed portfolio</small>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tab-nav">
          <button className={`tab-btn ${activeTab === 'dual' ? 'active' : ''}`} onClick={() => setActiveTab('dual')}>
            <Zap size={15} />
            <span>Dual-Format Drafter</span>
            <span className="tab-pill">Mission Core</span>
          </button>
          <button className={`tab-btn ${activeTab === 'drift' ? 'active' : ''}`} onClick={() => setActiveTab('drift')}>
            <ShieldCheck size={15} />
            <span>Drift Detector & Auditor</span>
          </button>
          <button className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`} onClick={() => setActiveTab('studio')}>
            <BookOpen size={15} />
            <span>Voice Guide & ChatGPT Project</span>
          </button>
          <button className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`} onClick={() => setActiveTab('single')}>
            <Feather size={15} />
            <span>Real Post Studio</span>
          </button>
          <button className={`tab-btn ${activeTab === 'submission' ? 'active' : ''}`} onClick={handleCompileSubmissionPack}>
            <Layers size={15} />
            <span>Submission Pack</span>
          </button>
        </nav>
      </header>

      {error && (
        <div className="global-error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Main Container */}
      <main className="main-content">
        {/* ========================================================================= */}
        {/* TAB 1: DUAL-FORMAT DRAFTER (Mission Step II)                              */}
        {/* ========================================================================= */}
        {activeTab === 'dual' && (
          <section className="view-section">
            <div className="view-header">
              <div>
                <span className="section-eyebrow">STEP II / MULTI-FORMAT VALIDATION</span>
                <h1>Draft the Same Message in Two Formats</h1>
                <p className="section-description">
                  Generate and test how your authentic voice adapts naturally across two contrasting formats
                  (e.g., Executive Email vs Casual Social Post) while maintaining core personality.
                </p>
              </div>

              <div className="header-actions">
                <button className="secondary-btn" onClick={() => setDualForm({
                  ...dualForm,
                  input: QUICK_PROMPTS[Math.floor(Math.random() * QUICK_PROMPTS.length)].text
                })}>
                  <RefreshCw size={14} />
                  <span>Random Preset Prompt</span>
                </button>
              </div>
            </div>

            {/* Prompt presets chips */}
            <div className="preset-chips-row">
              <span className="presets-label">INSPIRATION PRESETS:</span>
              {QUICK_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  className="preset-chip"
                  onClick={() => setDualForm(prev => ({ ...prev, input: p.text }))}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Input & Form Controls */}
            <div className="dual-draft-grid">
              {/* Left Form: Message Input & Dual Format Configurations */}
              <div className="card control-card">
                <div className="card-header">
                  <div>
                    <span className="card-kicker">01 / CORE MESSAGE</span>
                    <h3>What idea or message do you want to communicate?</h3>
                  </div>
                  <span className="char-badge">{dualForm.input.length} chars</span>
                </div>

                <textarea
                  className="main-textarea"
                  value={dualForm.input}
                  onChange={e => setDualForm(prev => ({ ...prev, input: e.target.value }))}
                  placeholder="Paste your raw thought, update, or topic here..."
                  rows={5}
                />

                <div className="format-pickers-row">
                  {/* Format A Box */}
                  <div className="format-column-picker">
                    <div className="picker-badge">FORMAT A (PRIMARY)</div>
                    <label>
                      <span>Output Format:</span>
                      <select
                        value={dualForm.format_a}
                        onChange={e => setDualForm(prev => ({ ...prev, format_a: e.target.value as FormatType }))}
                      >
                        {FORMAT_OPTIONS.map(f => (
                          <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
                        ))}
                      </select>
                    </label>

                    <div className="sub-selects">
                      <label>
                        <span>Tone Mode:</span>
                        <select
                          value={dualForm.mode_a}
                          onChange={e => setDualForm(prev => ({ ...prev, mode_a: e.target.value as Mode }))}
                        >
                          {MODE_OPTIONS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Audience:</span>
                        <select
                          value={dualForm.audience_a}
                          onChange={e => setDualForm(prev => ({ ...prev, audience_a: e.target.value as Audience }))}
                        >
                          {AUDIENCE_OPTIONS.map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Format B Box */}
                  <div className="format-column-picker">
                    <div className="picker-badge accent">FORMAT B (CONTRASTING)</div>
                    <label>
                      <span>Output Format:</span>
                      <select
                        value={dualForm.format_b}
                        onChange={e => setDualForm(prev => ({ ...prev, format_b: e.target.value as FormatType }))}
                      >
                        {FORMAT_OPTIONS.map(f => (
                          <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
                        ))}
                      </select>
                    </label>

                    <div className="sub-selects">
                      <label>
                        <span>Tone Mode:</span>
                        <select
                          value={dualForm.mode_b}
                          onChange={e => setDualForm(prev => ({ ...prev, mode_b: e.target.value as Mode }))}
                        >
                          {MODE_OPTIONS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Audience:</span>
                        <select
                          value={dualForm.audience_b}
                          onChange={e => setDualForm(prev => ({ ...prev, audience_b: e.target.value as Audience }))}
                        >
                          {AUDIENCE_OPTIONS.map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="length-selector">
                    <span>Length:</span>
                    {(['short', 'medium', 'long'] as Length[]).map(l => (
                      <button
                        key={l}
                        type="button"
                        className={`chip-btn ${dualForm.length === l ? 'active' : ''}`}
                        onClick={() => setDualForm(prev => ({ ...prev, length: l }))}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <button
                    className="primary-btn generate-btn"
                    onClick={handleDualGenerate}
                    disabled={loading}
                  >
                    <Sparkles size={16} />
                    <span>{loading ? 'Synthesizing Dual Drafts...' : 'Generate Both Formats'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Right: Side-by-Side Draft Results */}
              <div className="dual-results-container">
                {dualResponse ? (
                  <div className="dual-drafts-split">
                    {/* Draft A Card */}
                    <div className="card draft-result-card">
                      <div className="card-header">
                        <div>
                          <span className="format-tag primary">
                            {FORMAT_OPTIONS.find(f => f.id === dualResponse.draft_a.format_type)?.icon}{' '}
                            {FORMAT_OPTIONS.find(f => f.id === dualResponse.draft_a.format_type)?.label}
                          </span>
                          <span className="mode-tag">{dualResponse.draft_a.mode}</span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="icon-btn"
                            onClick={() => copyToClipboard(dualResponse.draft_a.content, setCopiedDraftA)}
                            title="Copy Draft"
                          >
                            {copiedDraftA ? <Check size={14} className="green" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="draft-content-box">
                        <pre className="draft-text">{dualResponse.draft_a.content}</pre>
                      </div>

                      <div className="draft-meta-footer">
                        <div className="eval-mini-scores">
                          <span className="score-badge green">
                            Overall {dualResponse.draft_a.evaluation.overall}/10
                          </span>
                          <span className="score-badge">
                            Naturalness {dualResponse.draft_a.evaluation.naturalness}/10
                          </span>
                          <span className="score-badge">
                            Anti-AI {dualResponse.draft_a.evaluation.ai_sounding}/10
                          </span>
                        </div>
                        <button
                          className="text-link-btn"
                          onClick={() => sendToDriftAuditor(dualResponse.draft_a.content, dualResponse.draft_a.mode, dualResponse.draft_a.evaluation)}
                        >
                          Audit for Drift →
                        </button>
                      </div>
                    </div>

                    {/* Draft B Card */}
                    <div className="card draft-result-card accent-border">
                      <div className="card-header">
                        <div>
                          <span className="format-tag accent">
                            {FORMAT_OPTIONS.find(f => f.id === dualResponse.draft_b.format_type)?.icon}{' '}
                            {FORMAT_OPTIONS.find(f => f.id === dualResponse.draft_b.format_type)?.label}
                          </span>
                          <span className="mode-tag">{dualResponse.draft_b.mode}</span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="icon-btn"
                            onClick={() => copyToClipboard(dualResponse.draft_b.content, setCopiedDraftB)}
                            title="Copy Draft"
                          >
                            {copiedDraftB ? <Check size={14} className="green" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="draft-content-box">
                        <pre className="draft-text">{dualResponse.draft_b.content}</pre>
                      </div>

                      <div className="draft-meta-footer">
                        <div className="eval-mini-scores">
                          <span className="score-badge green">
                            Overall {dualResponse.draft_b.evaluation.overall}/10
                          </span>
                          <span className="score-badge">
                            Naturalness {dualResponse.draft_b.evaluation.naturalness}/10
                          </span>
                          <span className="score-badge">
                            Anti-AI {dualResponse.draft_b.evaluation.ai_sounding}/10
                          </span>
                        </div>
                        <button
                          className="text-link-btn"
                          onClick={() => sendToDriftAuditor(dualResponse.draft_b.content, dualResponse.draft_b.mode, dualResponse.draft_b.evaluation)}
                        >
                          Audit for Drift →
                        </button>
                      </div>
                    </div>

                    {/* Drift Comparison Summary Banner */}
                    <div className="card comparison-banner">
                      <div className="comparison-banner-inner">
                        <ShieldCheck size={22} className="green" />
                        <div>
                          <strong>Multi-Format Voice Consistency Verified</strong>
                          <p>{dualResponse.drift_comparison.summary}</p>
                        </div>
                        <button className="primary-btn sm" onClick={handleCompileSubmissionPack}>
                          Compile Submission Pack
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card empty-state-card">
                    <div className="empty-state-inner">
                      <div className="empty-icon-circle">
                        <Sparkles size={28} />
                      </div>
                      <h3>Ready to Generate Dual Drafts</h3>
                      <p>
                        Choose your two target formats, input your core message or select an inspiration preset,
                        and press Generate to see side-by-side drafts tuned to Tanmay's voice.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DRIFT DETECTOR & CONSISTENCY AUDITOR                               */}
        {/* ========================================================================= */}
        {activeTab === 'drift' && (
          <section className="view-section">
            <div className="view-header">
              <div>
                <span className="section-eyebrow">STEP II / VOICE AUDIT & DRIFT REPAIR</span>
                <h1>Drift Detector & Consistency Auditor</h1>
                <p className="section-description">
                  Inspect drafts against the Voice Guide's core rules, detect generic AI phrases or rhythmic anomalies,
                  and patch your Voice Guide in 1 click to permanently prevent drift.
                </p>
              </div>
            </div>

            <div className="drift-view-grid">
              {/* Left: Input Text to Audit */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <span className="card-kicker">01 / DRAFT AUDIT INSPECTOR</span>
                    <h3>Draft Text to Analyze</h3>
                  </div>
                  <div className="mode-toggles">
                    {MODE_OPTIONS.map(m => (
                      <button
                        key={m.id}
                        className={`chip-btn sm ${driftMode === m.id ? 'active' : ''}`}
                        onClick={() => setDriftMode(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  className="main-textarea"
                  value={driftInput}
                  onChange={e => setDriftInput(e.target.value)}
                  placeholder="Paste any draft here to audit against Tanmay's authentic voice profile..."
                  rows={8}
                />

                <div className="card-footer">
                  <span className="hint-text">
                    Audits against: Anti-AI buzzword index, sentence cadence, directness, and natural qualifiers.
                  </span>
                  <button className="primary-btn" onClick={handleRunDriftAudit} disabled={loading}>
                    <ShieldCheck size={16} />
                    <span>{loading ? 'Auditing...' : 'Run Drift Audit'}</span>
                  </button>
                </div>
              </div>

              {/* Right: Scorecard & Drift Resolution */}
              <div className="card scorecard-card">
                <div className="card-header">
                  <div>
                    <span className="card-kicker">02 / LINGUISTIC SCORECARD</span>
                    <h3>Voice Alignment Metrics</h3>
                  </div>
                  {driftEval && (
                    <span className={`status-pill ${driftEval.drift_status}`}>
                      {driftEval.drift_status === 'aligned' ? '✓ Voice Aligned' : '⚠ Drift Detected'}
                    </span>
                  )}
                </div>

                {driftEval ? (
                  <div className="scorecard-body">
                    {/* Overall Score Circle */}
                    <div className="overall-score-display">
                      <div className="score-circle">
                        <span className="big-num">{driftEval.overall}</span>
                        <span className="denom">/10</span>
                      </div>
                      <div className="score-summary">
                        <h4>Overall Voice Fit</h4>
                        <p>
                          {driftEval.overall >= 8.5
                            ? 'Excellent adherence to authentic voice characteristics.'
                            : 'Minor stylistic drift detected. See recommendations below.'}
                        </p>
                      </div>
                    </div>

                    {/* Metric Bars Grid */}
                    <div className="metrics-bars-grid">
                      <div className="metric-bar-item">
                        <div className="metric-bar-label">
                          <span>Naturalness</span>
                          <strong>{driftEval.naturalness}/10</strong>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill green" style={{ width: `${driftEval.naturalness * 10}%` }} />
                        </div>
                      </div>

                      <div className="metric-bar-item">
                        <div className="metric-bar-label">
                          <span>Directness & Clarity</span>
                          <strong>{driftEval.directness}/10</strong>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill blue" style={{ width: `${driftEval.directness * 10}%` }} />
                        </div>
                      </div>

                      <div className="metric-bar-item">
                        <div className="metric-bar-label">
                          <span>Simplicity (Familiar words)</span>
                          <strong>{driftEval.simplicity}/10</strong>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill purple" style={{ width: `${driftEval.simplicity * 10}%` }} />
                        </div>
                      </div>

                      <div className="metric-bar-item">
                        <div className="metric-bar-label">
                          <span>Anti-AI Cleanliness</span>
                          <strong>{driftEval.ai_sounding}/10</strong>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill amber" style={{ width: `${driftEval.ai_sounding * 10}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Flagged Issues & 1-Click Guide Fix */}
                    <div className="drift-issues-box">
                      <h4>Linguistic Anomalies & Drift Points</h4>

                      {driftEval.flagged_phrases.length > 0 ? (
                        <div className="flagged-phrases-list">
                          {driftEval.flagged_phrases.map((phrase, i) => (
                            <div key={i} className="flagged-item">
                              <div className="flagged-info">
                                <AlertTriangle size={15} className="amber" />
                                <span>Forbidden / AI Cliché: <strong>"{phrase}"</strong></span>
                              </div>
                              <button
                                className="fix-guide-btn"
                                onClick={() => handleFixDriftInGuide(phrase)}
                                disabled={fixingDrift}
                              >
                                <Plus size={13} />
                                <span>Fix in Voice Guide</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-drift-banner">
                          <CheckCircle2 size={16} className="green" />
                          <span>No forbidden AI buzzwords detected in this draft.</span>
                        </div>
                      )}

                      {/* Guide Fix Recommendations */}
                      {driftEval.guide_fix_recommendations.length > 0 && (
                        <div className="recommendations-box">
                          <strong>Recommended Guide Fixes:</strong>
                          <ul>
                            {driftEval.guide_fix_recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-inner small">
                    <ShieldCheck size={28} />
                    <h4>No Audit Run Yet</h4>
                    <p>Paste a draft on the left and click "Run Drift Audit" to inspect voice metrics.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: VOICE GUIDE & CHATGPT PROJECT INSTRUCTIONS                         */}
        {/* ========================================================================= */}
        {activeTab === 'studio' && (
          <section className="view-section">
            <div className="view-header">
              <div>
                <span className="section-eyebrow">STEP I / AUTHORITATIVE REFERENCE & RULES</span>
                <h1>Voice Guide Studio & ChatGPT Project Instructions</h1>
                <p className="section-description">
                  Your voice guide extracted from real writing samples. Saved as ChatGPT Project instructions
                  so all future drafts permanently inherit your exact cadence and style.
                </p>
              </div>

              <div className="header-actions">
                <button className="secondary-btn" onClick={() => setShowSampleModal(true)}>
                  <Plus size={14} />
                  <span>Add Writing Sample</span>
                </button>
                <button
                  className="primary-btn"
                  onClick={() => copyToClipboard(profile?.chatgpt_project_instructions || '', setInstructionsCopied)}
                >
                  {instructionsCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{instructionsCopied ? 'Instructions Copied!' : 'Copy ChatGPT Instructions'}</span>
                </button>
              </div>
            </div>

            <div className="studio-grid">
              {/* Left: Authoritative Samples & Personality Rules */}
              <div className="studio-left-col">
                {/* 1. Core Philosophy */}
                <div className="card principle-banner-card">
                  <span className="card-kicker">CORE PRINCIPLE</span>
                  <h2>"Clarity before sophistication. Naturalness before perfection."</h2>
                  <div className="traits-pill-cloud">
                    {profile?.core.personality.map((t, i) => (
                      <span key={i} className="trait-pill">#{t}</span>
                    ))}
                  </div>
                </div>

                {/* 2. Writing Samples Vault */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <span className="card-kicker">WRITING SAMPLES VAULT</span>
                      <h3>Authoritative Samples ({profile?.samples.length || 3})</h3>
                    </div>
                  </div>

                  <div className="samples-accordion">
                    {profile?.samples.map((s, idx) => (
                      <div key={s.id} className="sample-card">
                        <div className="sample-head">
                          <div className="sample-title-group">
                            <span className="sample-idx">0{idx + 1}</span>
                            <strong>{s.title}</strong>
                          </div>
                          <span className="char-badge">{s.word_count} words</span>
                        </div>
                        <p className="sample-snippet">"{s.content}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Forbidden Patterns / AI Cliché Vault */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <span className="card-kicker">TABOO LIST</span>
                      <h3>Forbidden AI Jargon ({profile?.core.forbidden_patterns.length || 0})</h3>
                    </div>
                  </div>

                  <div className="taboo-tag-cloud">
                    {profile?.core.forbidden_patterns.map((item, idx) => (
                      <span key={idx} className="taboo-tag">
                        ✕ {item}
                      </span>
                    ))}
                  </div>

                  <div className="add-taboo-row">
                    <input
                      type="text"
                      value={newTaboo}
                      onChange={e => setNewTaboo(e.target.value)}
                      placeholder="Add new phrase to forbidden list..."
                      onKeyDown={e => e.key === 'Enter' && handleAddForbiddenPhrase()}
                    />
                    <button className="secondary-btn sm" onClick={handleAddForbiddenPhrase}>
                      Add Rule
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Live ChatGPT Project Instructions Exporter */}
              <div className="studio-right-col">
                <div className="card chatgpt-export-card">
                  <div className="card-header">
                    <div>
                      <span className="card-kicker">PERSISTENT INSTRUCTIONS</span>
                      <h3>ChatGPT Project System Prompt</h3>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => copyToClipboard(profile?.chatgpt_project_instructions || '', setInstructionsCopied)}
                      title="Copy System Instructions"
                    >
                      {instructionsCopied ? <Check size={14} className="green" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="instructions-preview-box">
                    <pre className="instructions-code">
                      {profile?.chatgpt_project_instructions || 'Loading instructions...'}
                    </pre>
                  </div>

                  <div className="card-footer">
                    <span className="hint-text">
                      Paste this into ChatGPT Project Settings → Custom Instructions.
                    </span>
                    <button
                      className="primary-btn sm"
                      onClick={() => copyToClipboard(profile?.chatgpt_project_instructions || '', setInstructionsCopied)}
                    >
                      <Copy size={14} />
                      <span>{instructionsCopied ? 'Copied' : 'Copy All Instructions'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal: Add New Sample */}
            {showSampleModal && (
              <div className="modal-overlay" onClick={() => setShowSampleModal(false)}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Add Authentic Writing Sample</h3>
                    <button className="close-btn" onClick={() => setShowSampleModal(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <label>
                      <span>Sample Title / Topic:</span>
                      <input
                        type="text"
                        value={sampleTitle}
                        onChange={e => setSampleTitle(e.target.value)}
                        placeholder="e.g. Onboarding reflection, Work boundaries, Technical breakdown"
                      />
                    </label>
                    <label>
                      <span>Exact Writing Transcript:</span>
                      <textarea
                        rows={6}
                        value={sampleContent}
                        onChange={e => setSampleContent(e.target.value)}
                        placeholder="Paste your authentic words without editing..."
                      />
                    </label>
                  </div>
                  <div className="modal-footer">
                    <button className="secondary-btn" onClick={() => setShowSampleModal(false)}>Cancel</button>
                    <button className="primary-btn" onClick={handleAddSample} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Reference Sample'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: REAL POST & AD STUDIO (Mission Step III)                           */}
        {/* ========================================================================= */}
        {activeTab === 'single' && (
          <section className="view-section">
            <div className="view-header">
              <div>
                <span className="section-eyebrow">STEP III / FINAL CREATIVE PUBLICATION</span>
                <h1>Real Post & Message Generator</h1>
                <p className="section-description">
                  Generate authentic social posts, ads, announcements, and newsletters. Refine live with 1-click tone actions.
                </p>
              </div>
            </div>

            <div className="single-studio-grid">
              {/* Left Column: Generator Form */}
              <div className="card control-card">
                <div className="card-header">
                  <div>
                    <span className="card-kicker">01 / INPUT & SETTINGS</span>
                    <h3>What do you want to publish?</h3>
                  </div>
                </div>

                <div className="mode-chips-grid">
                  {MODE_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      className={`mode-chip-card ${singleForm.mode === m.id ? 'active' : ''}`}
                      onClick={() => setSingleForm(prev => ({ ...prev, mode: m.id }))}
                    >
                      <strong>{m.label}</strong>
                      <small>{m.note}</small>
                    </button>
                  ))}
                </div>

                <textarea
                  className="main-textarea"
                  value={singleForm.input}
                  onChange={e => setSingleForm(prev => ({ ...prev, input: e.target.value }))}
                  placeholder="Describe your announcement, post idea, or draft..."
                  rows={5}
                />

                <div className="sub-selects-row">
                  <label>
                    <span>Target Format:</span>
                    <select
                      value={singleForm.format_type}
                      onChange={e => setSingleForm(prev => ({ ...prev, format_type: e.target.value as FormatType }))}
                    >
                      {FORMAT_OPTIONS.map(f => (
                        <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Audience:</span>
                    <select
                      value={singleForm.audience}
                      onChange={e => setSingleForm(prev => ({ ...prev, audience: e.target.value as Audience }))}
                    >
                      {AUDIENCE_OPTIONS.map(a => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="card-footer">
                  <button className="secondary-btn" onClick={() => handleSingleRun('rewrite')} disabled={loading}>
                    <RotateCcw size={15} />
                    <span>Rewrite</span>
                  </button>

                  <button className="primary-btn" onClick={() => handleSingleRun('generate')} disabled={loading}>
                    <Sparkles size={15} />
                    <span>{loading ? 'Generating...' : 'Generate Real Post'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Output & Refinement Chips */}
              <div className="card output-studio-card">
                <div className="card-header">
                  <div>
                    <span className="card-kicker">02 / LIVE VOICE RESULT</span>
                    <h3>Generated Publication Draft</h3>
                  </div>
                  {singleOutput && (
                    <button
                      className="icon-btn"
                      onClick={() => copyToClipboard(singleOutput, setSingleCopied)}
                    >
                      {singleCopied ? <Check size={15} className="green" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>

                <div className="output-content-box">
                  {singleOutput ? (
                    <pre className="output-text">{singleOutput}</pre>
                  ) : (
                    <div className="empty-state-inner small">
                      <Feather size={26} />
                      <p>Your generated authentic post will appear here.</p>
                    </div>
                  )}
                </div>

                {singleOutput && (
                  <div className="refinement-bar">
                    <span className="refine-title">1-Click Refine:</span>
                    <button className="refine-chip" onClick={() => handleSingleRun('refine', 'natural')} disabled={loading}>
                      🌱 More Natural
                    </button>
                    <button className="refine-chip" onClick={() => handleSingleRun('refine', 'concise')} disabled={loading}>
                      ✂️ More Concise
                    </button>
                    <button className="refine-chip" onClick={() => handleSingleRun('refine', 'punchy')} disabled={loading}>
                      ⚡ Punchier Hook
                    </button>
                    <button className="refine-chip" onClick={() => handleSingleRun('refine', 'regenerate')} disabled={loading}>
                      🔄 Regenerate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MISSION SUBMISSION PACK                                            */}
        {/* ========================================================================= */}
        {activeTab === 'submission' && (
          <section className="view-section">
            <div className="view-header">
              <div>
                <span className="section-eyebrow">FINAL ARTIFACT / HANDSHAKE SUBMISSION</span>
                <h1>Mission Submission Portfolio</h1>
                <p className="section-description">
                  Everything required by the Handshake assignment compiled into a structured, exportable markdown report.
                </p>
              </div>

              <div className="header-actions">
                <button
                  className="secondary-btn"
                  onClick={() => downloadMarkdown(submissionPack?.markdown_report || '', 'brand-voice-submission.md')}
                  disabled={!submissionPack}
                >
                  <Download size={14} />
                  <span>Download .md</span>
                </button>
                <button
                  className="primary-btn"
                  onClick={() => copyToClipboard(submissionPack?.markdown_report || '', setSubCopied)}
                  disabled={!submissionPack}
                >
                  {subCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{subCopied ? 'Report Copied!' : 'Copy Full Submission Report'}</span>
                </button>
              </div>
            </div>

            {submissionPack ? (
              <div className="submission-container">
                <div className="card submission-card">
                  <div className="markdown-rendered-view">
                    <pre className="markdown-pre">{submissionPack.markdown_report}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card empty-state-card">
                <div className="empty-state-inner">
                  <Layers size={32} />
                  <h3>Compiling Submission Pack...</h3>
                  <button className="primary-btn" onClick={handleCompileSubmissionPack}>
                    Generate Submission Report Now
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="brand-footer">
        <div className="footer-content">
          <span>Tanmay Brand Voice Generator • Handshake Mission Solution</span>
          <span>"Clarity before sophistication. Naturalness before perfection."</span>
        </div>
      </footer>
    </div>
  )
}
