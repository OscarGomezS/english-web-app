export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type Level = (typeof LEVELS)[number]

export type Status = 'opened' | 'studying' | 'completed'
export type DisplayStatus = Status | 'not_started'

export interface User {
  id: string
  email: string | null
  name: string | null
  picture: string | null
  timezone: string
}

export interface TopicSummary {
  id: string
  level: Level
  super_category: string
  sub_category: string
  short_title: string
  guideword: string
  can_do: string
  order: number
}

export interface LearnerExample {
  text: string
  meta: string | null
}

export interface Topic extends TopicSummary {
  lexical_range: string | null
  learner_examples: LearnerExample[]
}

export interface Exercise {
  id: string
  type: 'mcq' | 'fill' | 'correct'
  prompt: string
  options: string[] | null
}

export interface TopicContent {
  explanation: {
    summary: string
    pattern: string
    usage_notes: string[]
    common_mistakes: { wrong: string; right: string; why: string }[]
    examples: { text: string; highlight: [number, number] | null }[]
  }
  video_phrases: string[]
  exercises: Exercise[]
}

export interface TopicDetail {
  topic: Topic
  content: TopicContent | null
  status: Status | null
}

export interface ScoreRecord {
  score: number
  total: number
  created_at: string
}

export interface AttemptSummary {
  best: ScoreRecord | null
  last: ScoreRecord | null
  count: number
}

export interface ExerciseResult {
  exercise_id: string
  given: string
  correct: boolean
  answers: string[]
  explanation: string
}

export interface AttemptResult {
  score: number
  total: number
  results: ExerciseResult[]
  summary: AttemptSummary
}

export interface CalendarData {
  days: { date: string; total_seconds: number }[]
  total_seconds: number
  today: string
}

export interface DayDetail {
  date: string
  total_seconds: number
  topics: {
    topic_id: string
    seconds: number
    level: Level | null
    super_category: string | null
    sub_category: string | null
    short_title: string | null
  }[]
}

export type ProgressMap = Record<string, Status>
