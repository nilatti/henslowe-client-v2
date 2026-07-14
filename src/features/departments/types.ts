export interface Department {
  id: number
  name: string
  description?: string | null
}

export interface DepartmentSpecialization {
  id: number
  title: string
  department_id: number | null
}

export interface DepartmentDetail extends Department {
  specializations: DepartmentSpecialization[]
}
