import { describe, it, expect } from 'vitest'
import {
  getSuperAdminRole,
  getUserRoleForTheater,
  getUserRoleForProduction,
  theatersWhereUserIsAdmin,
  productionsWhereUserIsAdmin,
} from './authorizationUtils'

describe('getSuperAdminRole', () => {
  it('returns true when is_superadmin is true', () => {
    expect(getSuperAdminRole({ is_superadmin: true })).toBe(true)
  })

  it('returns false when is_superadmin is false', () => {
    expect(getSuperAdminRole({ is_superadmin: false })).toBe(false)
  })

  it('returns false when is_superadmin is undefined', () => {
    expect(getSuperAdminRole({})).toBe(false)
  })
})

describe('getUserRoleForTheater', () => {
  const superadmin = { is_superadmin: true }
  const regularUser = { is_superadmin: false }

  it('returns admin for superadmin regardless of jobs', () => {
    expect(getUserRoleForTheater(superadmin, [])).toBe('admin')
  })

  it('returns visitor when user has no jobs at all', () => {
    expect(getUserRoleForTheater(regularUser, [])).toBe('visitor')
  })

  it('returns admin for Artistic Director (theater-level)', () => {
    const jobs = [{
      theater_id: 1, production_id: null,
      specialization: { title: 'Artistic Director' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForTheater(regularUser, jobs)).toBe('admin')
  })

  it('returns admin for Theater Admin (theater-level)', () => {
    const jobs = [{
      theater_id: 1, production_id: null,
      specialization: { title: 'Theater Admin' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForTheater(regularUser, jobs)).toBe('admin')
  })

  it('returns admin for Executive Director (theater-level)', () => {
    const jobs = [{
      theater_id: 1, production_id: null,
      specialization: { title: 'Executive Director' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForTheater(regularUser, jobs)).toBe('admin')
  })

  it('returns member for Actor at theater level', () => {
    const jobs = [{
      theater_id: 1, production_id: null,
      specialization: { title: 'Actor' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForTheater(regularUser, jobs)).toBe('member')
  })

  it('does NOT grant theater admin for a production-level Director job', () => {
    const jobs = [{
      theater_id: 1, production_id: 5,
      specialization: { title: 'Director' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForTheater(regularUser, jobs)).toBe('member')
  })

  it('does NOT grant theater admin for a production-level Artistic Director job', () => {
    const jobs = [{
      theater_id: 1, production_id: 5,
      specialization: { title: 'Artistic Director' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForTheater(regularUser, jobs)).toBe('member')
  })
})

describe('getUserRoleForProduction', () => {
  const superadmin = { is_superadmin: true }
  const user = { is_superadmin: false }

  it('returns admin for superadmin', () => {
    expect(getUserRoleForProduction(superadmin, [])).toBe('admin')
  })

  it('returns visitor when user has no jobs', () => {
    expect(getUserRoleForProduction(user, [])).toBe('visitor')
  })

  it('returns admin for Director (production admin job title)', () => {
    const productionJobs = [{
      theater_id: 1, production_id: 2,
      specialization: { title: 'Director' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForProduction(user, productionJobs)).toBe('admin')
  })

  it('returns admin for Stage Manager', () => {
    const productionJobs = [{
      theater_id: 1, production_id: 2,
      specialization: { title: 'Stage Manager' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForProduction(user, productionJobs)).toBe('admin')
  })

  it('returns member for Actor on production', () => {
    const productionJobs = [{
      theater_id: 1, production_id: 2,
      specialization: { title: 'Actor' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForProduction(user, productionJobs)).toBe('member')
  })

  it('returns admin when theater-level admin job is provided', () => {
    const theaterJobs = [{
      theater_id: 1, production_id: null,
      specialization: { title: 'Artistic Director' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForProduction(user, [], theaterJobs)).toBe('admin')
  })

  it('returns member for theater-level Actor with no production job', () => {
    const theaterJobs = [{
      theater_id: 1, production_id: null,
      specialization: { title: 'Actor' }, end_date: '2099-01-01',
    }]
    expect(getUserRoleForProduction(user, [], theaterJobs)).toBe('member')
  })

  it('returns visitor with no jobs and no theaterJobs', () => {
    expect(getUserRoleForProduction(user, [], [])).toBe('visitor')
  })
})

describe('theatersWhereUserIsAdmin', () => {
  const superadmin = { id: 1, is_superadmin: true, jobs: [] }
  const regularUser = {
    id: 2,
    is_superadmin: false,
    jobs: [
      {
        theater_id: 1, production_id: null,
        specialization: { title: 'Artistic Director' }, end_date: '2099-01-01',
      },
      {
        theater_id: 2, production_id: null,
        specialization: { title: 'Actor' }, end_date: '2099-01-01',
      },
    ],
  }
  const theaters = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it('returns all theaters for superadmin', () => {
    expect(theatersWhereUserIsAdmin(superadmin, theaters)).toEqual(theaters)
  })

  it('returns only theaters where user has admin job', () => {
    const result = theatersWhereUserIsAdmin(regularUser, theaters)
    expect(result.map(t => t.id)).toEqual([1])
  })

  it('returns empty array when user has no admin jobs', () => {
    const nonAdmin = { id: 3, is_superadmin: false, jobs: [] }
    expect(theatersWhereUserIsAdmin(nonAdmin, theaters)).toEqual([])
  })
})

describe('productionsWhereUserIsAdmin', () => {
  const user = {
    id: 2,
    is_superadmin: false,
    jobs: [
      {
        theater_id: 1, production_id: 10,
        specialization: { title: 'Director' }, end_date: '2099-01-01',
      },
      {
        theater_id: 1, production_id: 20,
        specialization: { title: 'Actor' }, end_date: '2099-01-01',
      },
    ],
  }
  const productions = [
    { id: 10, theater_id: 1 },
    { id: 20, theater_id: 1 },
    { id: 30, theater_id: 1 },
  ]

  it('returns productions where user has admin job', () => {
    const result = productionsWhereUserIsAdmin(user, productions)
    expect(result.map(p => p.id)).toEqual([10])
  })
})
