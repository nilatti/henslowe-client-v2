import { test, expect } from '@playwright/test'
import { loginAs, mockStandardEndpoints, mockUsers } from './helpers/mockApi'

const mockMe = mockUsers.visitor

// Intercepts the /me endpoint used by the new cookie-based callback flow
async function mockSessionsMe(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/sessions/me**', route =>
    route.fulfill({ json: mockMe })
  )
}

test.describe('Cookie-based auth callback', () => {
  test('stores user profile in localStorage after callback — no token', async ({ page }) => {
    await mockSessionsMe(page)

    // Navigate as if Rails redirected here after setting the httpOnly cookie
    await page.goto('/auth/callback')

    // Should redirect to / after fetching /me
    await page.waitForURL('/')

    const authUser = await page.evaluate(() => localStorage.getItem('auth_user'))
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))

    expect(authUser).not.toBeNull()
    expect(JSON.parse(authUser!).email).toBe(mockMe.email)
    expect(authToken).toBeNull()
  })

  test('no token in the callback URL', async ({ page }) => {
    await mockSessionsMe(page)
    await page.goto('/auth/callback')
    await page.waitForURL('/')

    // URL during and after callback must not carry a token param
    expect(page.url()).not.toMatch(/[?&]token=/)
  })

  test('callback with error param redirects to home without setting auth', async ({ page }) => {
    await page.goto('/auth/callback?error=oauth_failed')
    await page.waitForURL('/')

    const authUser = await page.evaluate(() => localStorage.getItem('auth_user'))
    expect(authUser).toBeNull()
  })

  test('callback redirect_after_login is followed safely', async ({ page }) => {
    await mockSessionsMe(page)
    // Mock a protected endpoint the redirect target would hit
    await page.route('**/api/v1/productions/production_names**', route =>
      route.fulfill({ json: [] })
    )
    await page.route('**/api/v1/phases**', route => route.fulfill({ json: [] }))
    await page.route('**/api/v1/theaters**', route => route.fulfill({ json: [] }))
    await page.route('**/api/v1/jobs**', route => route.fulfill({ json: [] }))
    await page.route('**/api/v1/users/**', route =>
      route.fulfill({ json: { ...mockMe, jobs: [], rehearsals: [], conflicts: [], conflict_patterns: [], timezone: 'America/New_York' } })
    )

    await page.addInitScript(() => {
      localStorage.setItem('redirect_after_login', '/productions')
    })
    await mockSessionsMe(page)

    await page.goto('/auth/callback')
    await page.waitForURL('/productions')
    expect(page.url()).toContain('/productions')
  })

  test('unsafe redirect_after_login is blocked — falls back to /', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('redirect_after_login', '//evil.com/phishing')
    })
    await mockSessionsMe(page)
    await page.goto('/auth/callback')
    await page.waitForURL('/')
    expect(page.url()).not.toContain('evil.com')
  })

  test('/me failure on callback redirects to home — no partial auth state', async ({ page }) => {
    await page.route('**/api/v1/sessions/me**', route =>
      route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    )
    await page.goto('/auth/callback')
    await page.waitForURL('/')

    const authUser = await page.evaluate(() => localStorage.getItem('auth_user'))
    expect(authUser).toBeNull()
  })
})

test.describe('Existing auth state still works', () => {
  test('user stored in localStorage (no token) is treated as authenticated', async ({ page }) => {
    await mockStandardEndpoints(page)
    // Simulate post-migration state: auth_user set, no auth_token
    await page.addInitScript((u) => {
      localStorage.setItem('auth_user', JSON.stringify(u))
      // Deliberately do NOT set auth_token
    }, mockMe)

    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })
})
