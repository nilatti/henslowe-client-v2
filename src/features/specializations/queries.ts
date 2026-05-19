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
export const updateSpecializationFn = updateMutationFn<Specialization>('specializations')
export const deleteSpecializationFn = deleteMutationFn('specializations')
