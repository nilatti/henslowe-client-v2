import { test, expect } from '@playwright/test'
import {
  loginAs,
  mockStandardEndpoints,
  mockProductionAdminJobs,
  mockTheaterMemberJobs,
} from './helpers/mockApi'

test.describe('Production detail — role-based UI', () => {
  test.beforeEach(async ({ page }) => {
    await mockStandardEndpoints(page)
  })

  test('production admin sees edit controls', async ({ page }) => {
    await loginAs(page, 'productionAdmin')
    // Override the broad jobs mock with production-specific admin jobs
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: mockProductionAdminJobs })
    )
    await page.goto('/productions/1')
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible()
  })

  test('visitor does not see edit controls', async ({ page }) => {
    await loginAs(page, 'visitor')
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: [] })
    )
    await page.goto('/productions/1')
    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible()
  })

  test('visitor can still see production title', async ({ page }) => {
    await loginAs(page, 'visitor')
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: [] })
    )
    await page.goto('/productions/1')
    await expect(page.getByRole('heading', { name: 'Hamlet' })).toBeVisible()
  })

  test('production member does not see edit controls', async ({ page }) => {
    await loginAs(page, 'theaterMember')
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: mockTheaterMemberJobs })
    )
    await page.goto('/productions/1')
    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible()
  })
})
