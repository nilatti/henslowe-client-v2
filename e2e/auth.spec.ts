import { test, expect } from '@playwright/test'
import { loginAs, mockStandardEndpoints } from './helpers/mockApi'

test.describe('Public (unauthenticated)', () => {
  test('shows login button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Log in or sign up with Google')).toBeVisible()
  })

  test('shows Welcome page at /', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/free service/i)).toBeVisible()
  })

  test('free tier casting is accessible without login', async ({ page }) => {
    await page.route('**/api/v1/plays/play_titles**', route =>
      route.fulfill({ json: [] })
    )
    await page.goto('/free/casting')
    await expect(page.getByText(/choose the play/i)).toBeVisible()
  })

  test('authenticated route redirects to home for unauthenticated user', async ({ page }) => {
    await page.goto('/productions')
    // _authenticated route redirects to / which shows the public shell
    await expect(page.getByText('Log in or sign up with Google')).toBeVisible()
  })
})

test.describe('Authenticated user', () => {
  test.beforeEach(async ({ page }) => {
    await mockStandardEndpoints(page)
    await loginAs(page, 'visitor')
  })

  test('shows full-access nav after login', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Productions' })).toBeVisible()
  })

  test('shows user greeting', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Hi,/i)).toBeVisible()
  })
})

test.describe('Superadmin nav', () => {
  test.beforeEach(async ({ page }) => {
    await mockStandardEndpoints(page)
    await loginAs(page, 'superadmin')
  })

  test('superadmin sees Authors, Plays, and Specializations nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Authors' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Plays' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Specializations' })).toBeVisible()
  })
})

test.describe('Regular user nav', () => {
  test.beforeEach(async ({ page }) => {
    await mockStandardEndpoints(page)
    await loginAs(page, 'visitor')
  })

  test('regular user does not see admin-only nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Authors' })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Plays' })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Specializations' })).not.toBeVisible()
  })
})
