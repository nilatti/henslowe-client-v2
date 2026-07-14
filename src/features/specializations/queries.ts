import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../api/queryFactory'
import api from '../../api/client'
import type { Specialization, SpecializationDetail } from './types'

export const specializationsQueryOptions = () =>
  listQueryOptions<Specialization>('specializations')

export const specializationQueryOptions = (id: number) =>
  detailQueryOptions<SpecializationDetail>('specializations', id)

export const createSpecializationFn = createMutationFn<Specialization>('specializations')
export const updateSpecializationFn = updateMutationFn<Omit<Specialization, 'default_start_phase' | 'default_end_phase' | 'department'>>('specializations')
export const deleteSpecializationFn = deleteMutationFn('specializations')

export const updateSpecializationDepartmentFn = (data: { id: number; department_id: number | null }) =>
  api.put(`/api/v1/specializations/${data.id}`, { specialization: { department_id: data.department_id } }).then(r => r.data)
