export interface Hospital {
  id: number
  name: string
  doctor_name: string | null
  personality: string | null
  phone: string | null
  address: string | null
  notes: string | null
  last_visit: string | null
  next_visit: string | null
  created_at: string
  updated_at: string
}

export interface Visit {
  id: number
  hospital_id: number
  visit_date: string
  visit_type: 'visit' | 'meal' | 'call' | 'other'
  time: string | null
  location: string | null
  content: string
  is_completed: 0 | 1
  created_at: string
}

export interface ExtractedData {
  hospital_name: string | null
  doctor_name: string | null
  personality: string | null
  phone: string | null
  address: string | null
  notes: string | null
  events: ExtractedEvent[]
  is_update_only: boolean
}

export interface ExtractedEvent {
  type: Visit['visit_type']
  date: string
  time: string | null
  location: string | null
  content: string
}

export interface MergedData {
  doctor_name: string | null
  personality: string | null
  phone: string | null
  address: string | null
  notes: string | null
  new_events: ExtractedEvent[]
}

export interface RecordingState {
  status: 'idle' | 'recording' | 'processing' | 'done' | 'error'
  transcript: string
  extracted: ExtractedData | null
  matchedHospital: Hospital | null
  errorMessage: string | null
}
