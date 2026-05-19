export interface Specialization {
  id: number
  title: string
  description?: string | null
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
}
