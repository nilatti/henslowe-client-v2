export interface Theater {
  id: number
  name: string
  street_address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone_number: string | null
  mission_statement: string | null
  website: string | null
  calendar_url: string | null
  logo: string | null
  fake: boolean
  subscription_status?: string | null
  created_at: string
  updated_at: string
}

export interface TheaterSpace {
  id: number
  name: string
  seating_capacity: number | null
  city: string | null
  state: string | null
}

export interface TheaterProduction {
  id: number
  start_date: string | null
  end_date: string | null
  play: {
    id: number
    title: string
  }
}

export interface TheaterJob {
  id: number
  specialization_id: number
  user_id: number
  specialization: {
    id: number
    title: string
  }
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
}

export interface TheaterSkeleton extends Theater {
  spaces: TheaterSpace[]
  productions: TheaterProduction[]
  jobs: TheaterJob[]
}
