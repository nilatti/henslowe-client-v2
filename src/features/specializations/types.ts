import type { Phase } from '../phases/types'

export type SpecializationContext = 'theater' | 'production' | 'both'

export interface SpecializationDepartment {
  id: number
  name: string
}

export interface Specialization {
  id: number
  title: string
  description?: string | null
  production_admin: boolean
  theater_admin: boolean
  context: SpecializationContext
  default_start_phase_id: number | null
  default_end_phase_id: number | null
  default_start_phase: Phase | null
  default_end_phase: Phase | null
  department_id: number | null
  department: SpecializationDepartment | null
}

export interface SpecializationUser {
  id: number
  email: string
  fake: boolean
  first_name: string
  last_name: string
  preferred_name?: string | null
  program_name?: string | null
}

export interface SpecializationCharacter {
  name: string
  xml_id?: string | null
}

export interface SpecializationProduction {
  play: { title: string }
}

export interface SpecializationTheater {
  id: number
  name: string
}

export interface SpecializationJob {
  id: number
  character?: SpecializationCharacter | null
  production?: SpecializationProduction | null
  theater: SpecializationTheater
  user: SpecializationUser
}

export interface SpecializationDetail extends Specialization {
  jobs: SpecializationJob[]
  default_start_phase: Phase | null
  default_end_phase: Phase | null
}
