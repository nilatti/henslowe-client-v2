import { test, expect } from '@playwright/test'

const shakespearePlays = [
  { id: 1, title: 'Hamlet', author: { last_name: 'Shakespeare' } },
  { id: 2, title: 'Macbeth', author: { last_name: 'Shakespeare' } },
]

const mockPlayScript = {
  id: 1,
  title: 'Hamlet',
  canonical: true,
  characters: [{ id: 1, name: 'Hamlet' }, { id: 2, name: 'Horatio' }],
  character_groups: [],
  acts: [],
}

test.describe('Free tier — SelectPlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/plays/play_titles**', route =>
      route.fulfill({ json: shakespearePlays })
    )
    await page.route('**/api/v1/plays/1/play_script**', route =>
      route.fulfill({ json: mockPlayScript })
    )
    await page.route('**/api/v1/plays/1/play_skeleton**', route =>
      route.fulfill({ json: { ...mockPlayScript, acts: [] } })
    )
  })

  test('shows play selector combobox', async ({ page }) => {
    await page.goto('/free/casting')
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('lists Shakespeare plays in selector', async ({ page }) => {
    await page.goto('/free/casting')
    const select = page.getByRole('combobox')
    await expect(select.getByRole('option', { name: 'Hamlet' })).toBeAttached()
    await expect(select.getByRole('option', { name: 'Macbeth' })).toBeAttached()
  })
})

test.describe('Free tier — sessionStorage persistence', () => {
  test('play title survives page reload when stored in sessionStorage', async ({ page }) => {
    await page.route('**/api/v1/plays/play_titles**', route =>
      route.fulfill({ json: shakespearePlays })
    )
    await page.goto('/free/casting')

    // Inject a minimal Zustand persist snapshot matching the store key
    await page.evaluate((script) => {
      sessionStorage.setItem(
        'free-play-store',
        JSON.stringify({ state: { play: script, playSkeleton: null, castings: [], fakeActors: { female: 0, male: 0, nonbinary: 0 }, fakeActorsArray: [], loading: false }, version: 0 })
      )
    }, mockPlayScript)

    await page.reload()
    await expect(page.getByText('Hamlet')).toBeVisible()
  })
})

test.describe('Free tier — free tools navigation', () => {
  test('can navigate to Cut tool', async ({ page }) => {
    await page.route('**/api/v1/plays/play_titles**', route =>
      route.fulfill({ json: shakespearePlays })
    )
    await page.goto('/free/cut')
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('can navigate to doubling chart', async ({ page }) => {
    await page.route('**/api/v1/plays/play_titles**', route =>
      route.fulfill({ json: shakespearePlays })
    )
    await page.goto('/free/doubling')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})
