import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../api/queryFactory'
import type { Specialization, SpecializationDetail } from './types'

export const specializationsQueryOptions = () =>
  listQueryOptions<Specialization>('specializations')

export const specializationQueryOptions = (id: number) =>
  detailQueryOptions<SpecializationDetail>('specializations', id)

export const createSpecializationFn = createMutationFn<Specialization>('specializations')
export const updateSpecializationFn = updateMutationFn<Omit<Specialization, 'default_start_phase' | 'default_end_phase'>>('specializations')
export const deleteSpecializationFn = deleteMutationFn('specializations')
