export interface AuditionSubmission {
  id: number
  video_url: string | null
  notes: string | null
}

export interface OpenAudition {
  production_id: number
  play_title: string | null
  theater_name: string | null
  theater_city: string | null
  theater_state: string | null
  audition_start_date: string | null
  audition_end_date: string | null
  rehearsal_start_date: string | null
  run_end_date: string | null
}
