export interface Author {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string
  nationality: string | null
  gender: string | null
  birthdate: string | null
  deathdate: string | null
  created_at: string
  updated_at: string
}

export interface AuthorWithPlays extends Author {
  plays: AuthorPlay[]
}

export interface AuthorPlay {
  id: number
  title: string
  canonical: boolean
  date: string | null
}
