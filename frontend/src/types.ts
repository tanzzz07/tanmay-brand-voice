export type Mode = 'casual' | 'professional' | 'technical' | 'spoken'
export type Audience = 'general' | 'recruiter' | 'technical' | 'friend' | 'client' | 'custom'
export type Length = 'short' | 'medium' | 'long'
export type Action = 'generate' | 'rewrite' | 'refine'
export type FormatType =
  | 'email'
  | 'social_post'
  | 'linkedin_post'
  | 'tweet_thread'
  | 'slack_message'
  | 'ad_copy'
  | 'video_script'
  | 'technical_breakdown'

export interface FormState {
  input: string
  mode: Mode
  audience: Audience
  custom_audience?: string
  length: Length
  context: string
  format_type: FormatType
}

export interface DualDraftFormState {
  input: string
  format_a: FormatType
  mode_a: Mode
  audience_a: Audience
  format_b: FormatType
  mode_b: Mode
  audience_b: Audience
  length: Length
  context: string
}

export interface DriftDetail {
  type: string
  severity: 'low' | 'medium' | 'high'
  phrase?: string
  count?: number
  reason: string
}

export interface EvaluationResult {
  naturalness: number
  directness: number
  simplicity: number
  context_fit: number
  conversational: number
  ai_sounding: number
  verbosity: number
  mode_consistency: number
  overall: number
  word_count: number
  sentence_count: number
  avg_sentence_length: number
  drift_status: 'aligned' | 'minor_drift' | 'drift_detected'
  issues: string[]
  flagged_phrases: string[]
  drift_details: DriftDetail[]
  guide_fix_recommendations: string[]
}

export interface ContentResponse {
  content: string
  mode: Mode
  format_type?: string
  evaluation?: EvaluationResult
}

export interface DraftItem {
  format_type: string
  mode: Mode
  audience: string
  content: string
  evaluation: EvaluationResult
}

export interface DualDraftResponse {
  topic: string
  draft_a: DraftItem
  draft_b: DraftItem
  drift_comparison: {
    draft_a_score: number
    draft_b_score: number
    consistency_delta: number
    total_issues_count: number
    flagged_phrases: string[]
    summary: string
    recommended_guide_fixes: string[]
  }
}

export interface SampleItem {
  id: string
  filename: string
  title: string
  content: string
  word_count: number
  char_count: number
}

export interface VoiceProfileResponse {
  core: {
    personality: string[]
    principle: string
    sentence_style: {
      preferred: string[]
      avoid: string[]
    }
    vocabulary: {
      prefer: string
      avoid: string[]
    }
    reasoning_style: string[]
    natural_qualifiers: string[]
    forbidden_patterns: string[]
    general_rules: string[]
  }
  modes: Record<string, any>
  samples: SampleItem[]
  chatgpt_project_instructions: string
}

export interface SubmissionPackResponse {
  project_title: string
  student_name: string
  chatgpt_project_instructions: string
  writing_samples: SampleItem[]
  draft_a: {
    format: string
    content: string
    evaluation: EvaluationResult
  }
  draft_b: {
    format: string
    content: string
    evaluation: EvaluationResult
  }
  drift_analysis_summary: {
    notes: string
    guide_fixes: string[]
  }
  final_post: {
    format: string
    content: string
    evaluation: EvaluationResult
  }
  markdown_report: string
}

