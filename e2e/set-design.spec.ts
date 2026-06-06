import { test, expect } from '@playwright/test'
import {
  loginAs,
  mockStandardEndpoints,
  mockProductionAdminJobs,
  mockTheaterAdminJobs,
  mockTheaterMemberJobs,
} from './helpers/mockApi'

const stageExits = [{ id: 1, name: 'Stage Right Vom', production_id: 1 }]

test.describe('Set Design — Stage Exits', () => {
  test.beforeEach(async ({ page }) => {
    await mockStandardEndpoints(page)
    await page.route('**/api/v1/productions/1/stage_exits**', route =>
      route.fulfill({ json: stageExits })
    )
  })

  test('production admin sees Add Stage Exit button', async ({ page }) => {
    await loginAs(page, 'productionAdmin')
    // Override jobs so useUserRoleForProduction returns 'admin'
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: mockProductionAdminJobs })
    )
    await page.goto('/productions/1/set-design')
    await expect(page.getByText('Stage Right Vom')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Stage Exit' })).toBeVisible()
  })

  test('theater admin sees Add Stage Exit button', async ({ page }) => {
    await loginAs(page, 'theaterAdmin')
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: mockTheaterAdminJobs })
    )
    await page.goto('/productions/1/set-design')
    await expect(page.getByRole('button', { name: 'Add Stage Exit' })).toBeVisible()
  })

  test('production member cannot add a stage exit', async ({ page }) => {
    await loginAs(page, 'theaterMember')
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: mockTheaterMemberJobs })
    )
    await page.goto('/productions/1/set-design')
    await expect(page.getByText('Stage Right Vom')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Stage Exit' })).not.toBeVisible()
  })

  test('superadmin sees Add Stage Exit button', async ({ page }) => {
    await loginAs(page, 'superadmin')
    await page.goto('/productions/1/set-design')
    await expect(page.getByRole('button', { name: 'Add Stage Exit' })).toBeVisible()
  })
})
