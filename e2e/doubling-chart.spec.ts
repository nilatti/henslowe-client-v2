import { test, expect } from '@playwright/test'
import { loginAs, mockStandardEndpoints, mockProductionAdminJobs } from './helpers/mockApi'

const mockPlayScript = {
  id: 1,
  title: 'Hamlet',
  canonical: false,
  production_id: 1,
  characters: [
    { id: 1, name: 'Hamlet' },
    { id: 2, name: 'Horatio' },
  ],
  character_groups: [],
  acts: [
    {
      id: 1,
      number: 1,
      heading: 'Act 1',
      original_line_count: 10,
      new_line_count: 10,
      scenes: [
        {
          id: 1,
          number: 1,
          pretty_name: '1.1',
          original_line_count: 10,
          new_line_count: 10,
          french_scenes: [
            {
              id: 1,
              number: 1,
              pretty_name: '1.1.1',
              original_line_count: 10,
              new_line_count: 10,
              on_stages: [
                { id: 1, character_id: 1, character: { id: 1, name: 'Hamlet' }, nonspeaking: false },
                { id: 2, character_id: 2, character: { id: 2, name: 'Horatio' }, nonspeaking: false },
              ],
              lines: [],
              stage_directions: [],
              sound_cues: [],
            },
          ],
        },
      ],
    },
  ],
}

// specialization_id: 2 is ACTOR_SPECIALIZATION_ID — required by getCastings/getActors filters
const singleActorJobs = [
  {
    id: 1,
    user_id: 10,
    character_id: 1,
    production_id: 1,
    specialization_id: 2,
    character: { id: 1, name: 'Hamlet' },
    user: { id: 10, first_name: 'John', last_name: 'Smith', email: 'john@test.com' },
    specialization: { title: 'Actor' },
    start_date: '2020-01-01',
    end_date: '2099-01-01',
  },
]

const doublingConflictJobs = [
  ...singleActorJobs,
  {
    id: 2,
    user_id: 10,
    character_id: 2,
    production_id: 1,
    specialization_id: 2,
    character: { id: 2, name: 'Horatio' },
    user: { id: 10, first_name: 'John', last_name: 'Smith', email: 'john@test.com' },
    specialization: { title: 'Actor' },
    start_date: '2020-01-01',
    end_date: '2099-01-01',
  },
]

test.describe('Doubling Charts', () => {
  test.beforeEach(async ({ page }) => {
    await mockStandardEndpoints(page)
    await loginAs(page, 'productionAdmin')
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: [...mockProductionAdminJobs, ...singleActorJobs] })
    )
    await page.route('**/api/v1/plays/1/play_script**', route =>
      route.fulfill({ json: mockPlayScript })
    )
  })

  test('renders Doubling Charts heading', async ({ page }) => {
    await page.goto('/productions/1/doubling-charts')
    await expect(page.getByText(/Doubling Charts for/i)).toBeVisible()
  })

  test('shows Acts tab active by default with "Actor" column header', async ({ page }) => {
    await page.goto('/productions/1/doubling-charts')
    await expect(page.getByRole('columnheader', { name: 'Actor' })).toBeVisible()
    await expect(page.getByText('Act 1')).toBeVisible()
  })

  test('switching to Scenes tab shows scene pretty name', async ({ page }) => {
    await page.goto('/productions/1/doubling-charts')
    await page.getByRole('button', { name: 'Scenes', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: '1.1' })).toBeVisible()
  })

  test('switching to French Scenes tab shows french scene pretty name', async ({ page }) => {
    await page.goto('/productions/1/doubling-charts')
    await page.getByRole('button', { name: 'French Scenes', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: '1.1.1' })).toBeVisible()
  })

  test('shows orange cell for doubling conflict', async ({ page }) => {
    await page.route('**/api/v1/jobs**', route =>
      route.fulfill({ json: [...mockProductionAdminJobs, ...doublingConflictJobs] })
    )
    await page.goto('/productions/1/doubling-charts')
    const conflictCell = page.locator('td.bg-orange-400')
    await expect(conflictCell).toBeVisible()
  })

  test('shows actor name in chart row', async ({ page }) => {
    await page.goto('/productions/1/doubling-charts')
    await expect(page.getByText('John Smith')).toBeVisible()
  })
})
