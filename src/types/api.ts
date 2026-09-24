export interface Interview {
  slug: string
  title: string
  description: string | null
  status: string
  background: string | null
  study_goal: string | null
  welcome_message: string | null
  closing_message: string | null
  allow_anonymous: boolean
  user_language: string
  participant_count: number
  created_at: string | null
  published_at: string | null
  config: {
    tts?: unknown
  }
}

export interface InterviewListResponse {
  items: Interview[]
  total: number
  page: number
  size: number
}

export interface OutlineSection {
  id: string | null
  readableId: string | null
  sectionTitle: string
  sectionType: "flat" | "screening"
  items: OutlineItem[]
}

export interface OutlineItem {
  id: string | null
  readableId: string | null
  itemType: string
  questionType: string | null
  text: string
  options?: StudyGuideOption[]
}

export interface StudyGuideOptionValue {
  id?: string
  text: string
  status?: "approve" | "reject" | "neutral"
  isOtherOption?: boolean
  isExclusive?: boolean
}

export type StudyGuideOption = string | StudyGuideOptionValue

export interface OutlineResponse {
  outline: OutlineSection[]
}

export interface Conversation {
  readable_id: number
  participant_name: string | null
  status: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  active_time_seconds: number | null
  has_cleaned_data?: boolean
  summary?: string | null
  user_profile?: Record<string, unknown> | null
  conversation_quality_score?: number | null
  messages?: Message[]
}

export interface ConversationListResponse {
  items: Conversation[]
  total: number
  page: number
  size: number
}

export interface Message {
  role: string
  content: string
  timestamp?: string
}

export interface TranscriptResponse {
  readable_id: number
  format: string
  transcript: string
}

export interface AnswersResponse {
  readable_id: number
  cleaned_at: string | null
  questions: unknown[]
}

export interface InterviewStats {
  total_conversations: number
  completed: number
  in_progress: number
  screened_out: number
  failed: number
  timed_out: number
  completion_rate: number
  avg_active_time_seconds: number | null
  median_active_time_seconds: number | null
}

export interface InsightResponse {
  id: string
  interview_id: string
  version: number
  sections: unknown[]
  created_at: string
}
