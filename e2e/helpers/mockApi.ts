import { Page } from '@playwright/test'

// AuthUser shape (matches src/types/auth.ts)
export const mockUsers = {
  superadmin: {
    id: 1,
    email: 'superadmin@test.com',
    first_name: 'Super',
    last_name: 'Admin',
    role: 'superadmin',
    subscription_status: 'active',
    is_superadmin: true,
  },
  theaterAdmin: {
    id: 2,
    email: 'theater_admin@test.com',
    first_name: 'Theater',
    last_name: 'Admin',
    role: 'regular',
    subscription_status: 'active',
    is_superadmin: false,
  },
  productionAdmin: {
    id: 3,
    email: 'prod_admin@test.com',
    first_name: 'Production',
    last_name: 'Admin',
    role: 'regular',
    subscription_status: 'active',
    is_superadmin: false,
  },
  theaterMember: {
    id: 4,
    email: 'member@test.com',
    first_name: 'Theater',
    last_name: 'Member',
    role: 'regular',
    subscription_status: 'active',
    is_superadmin: false,
  },
  visitor: {
    id: 5,
    email: 'visitor@test.com',
    first_name: 'Visitor',
    last_name: 'User',
    role: 'regular',
    subscription_status: 'active',
    is_superadmin: false,
  },
}

export const mockTheaterAdminJobs = [
  {
    id: 10,
    theater_id: 1,
    production_id: null,
    specialization: { title: 'Artistic Director', theater_admin: true },
    start_date: '2020-01-01',
    end_date: '2099-01-01',
  },
]

export const mockProductionAdminJobs = [
  {
    id: 11,
    theater_id: 1,
    production_id: 1,
    specialization: { title: 'Director', production_admin: true },
    start_date: '2020-01-01',
    end_date: '2099-01-01',
  },
]

export const mockTheaterMemberJobs = [
  {
    id: 12,
    theater_id: 1,
    production_id: 1,
    specialization: { title: 'Actor', theater_admin: false, production_admin: false },
    start_date: '2020-01-01',
    end_date: '2099-01-01',
  },
]

// Shape returned by /api/v1/productions/:id/skeleton
export const mockProductionSkeleton = {
  id: 1,
  theater_id: 1,
  play: { id: 1, title: 'Hamlet', canonical: false },
  play_id: 1,
  theater: { id: 1, name: 'Dream Theater' },
  start_date: '2025-01-01',
  end_date: '2025-06-01',
  stage_exits: [],
}

// Alias kept for backwards compat within this file
export const mockProduction = mockProductionSkeleton

export const mockTheater = {
  id: 1,
  name: 'Dream Theater',
  city: 'Springfield',
  mission_statement: 'Making great theater.',
}

// Sets up auth state by injecting localStorage before page load.
// Must be called before page.goto() to take effect on initial render.
export async function loginAs(page: Page, userKey: keyof typeof mockUsers) {
  const user = mockUsers[userKey]
  await page.addInitScript(({ u, t }) => {
    localStorage.setItem('auth_user', JSON.stringify(u))
    localStorage.setItem('auth_token', t)
  }, { u: user, t: 'mock-jwt-token' })
}

// Intercepts the standard API endpoints used by most pages.
// Call before page.goto() so routes are registered in time.
// Minimal user payload that satisfies DashboardUser (jobs, rehearsals, timezone)
export function mockDashboardUser(authUser: typeof mockUsers[keyof typeof mockUsers]) {
  return {
    ...authUser,
    jobs: [],
    rehearsals: [],
    conflicts: [],
    conflict_patterns: [],
    timezone: 'America/New_York',
  }
}

export async function mockStandardEndpoints(page: Page) {
  // Production skeleton (used by most production routes)
  await page.route('**/api/v1/productions/1/skeleton**', route =>
    route.fulfill({ json: mockProductionSkeleton })
  )
  // Production list
  await page.route('**/api/v1/productions/production_names**', route =>
    route.fulfill({ json: [mockProductionSkeleton] })
  )
  await page.route('**/api/v1/theaters/**', route =>
    route.fulfill({ json: mockTheater })
  )
  await page.route('**/api/v1/theaters**', route =>
    route.fulfill({ json: [mockTheater] })
  )
  // Jobs — role-check endpoints; individual tests override this as needed
  await page.route('**/api/v1/jobs**', route =>
    route.fulfill({ json: [] })
  )
  await page.route('**/api/v1/productions/1/stage_exits**', route =>
    route.fulfill({ json: [] })
  )
  await page.route('**/api/v1/spaces**', route =>
    route.fulfill({ json: [] })
  )
  // Users — each user returns their own dashboard payload
  await page.route('**/api/v1/users/**', route => {
    const url = route.request().url()
    const match = url.match(/\/users\/(\d+)/)
    const userId = match ? parseInt(match[1]) : 0
    const user = Object.values(mockUsers).find(u => u.id === userId) ?? mockUsers.visitor
    route.fulfill({ json: mockDashboardUser(user) })
  })
  await page.route('**/api/v1/users**', route =>
    route.fulfill({ json: [] })
  )
  // Plays list — used by production detail route loader
  await page.route('**/api/v1/plays/play_titles**', route =>
    route.fulfill({ json: [] })
  )
}
