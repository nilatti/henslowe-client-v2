import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../api/queryFactory'
import type { Department, DepartmentDetail } from './types'

export const departmentsQueryOptions = () =>
  listQueryOptions<Department>('departments')

export const departmentQueryOptions = (id: number) =>
  detailQueryOptions<DepartmentDetail>('departments', id)

export const createDepartmentFn = createMutationFn<Department>('departments')
export const updateDepartmentFn = updateMutationFn<Department>('departments')
export const deleteDepartmentFn = deleteMutationFn('departments')
