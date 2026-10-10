import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  }
})

vi.mock('../../../../hooks/useUserRole', () => ({
  useIsSuperAdmin: () => false,
  useUserRoleForProduction: () => 'member',
}))

vi.mock('../../../../features/productions/components/ProductionPhasesSection', () => ({
  ProductionPhasesSection: () => null,
}))

import { Route } from './index'

const ProductionInfoRoute = Route.options.component as React.ComponentType

function setup(play: object | null) {
  vi.spyOn(Route, 'useParams').mockReturnValue({ productionId: '42' } as never)
  mockUseSuspenseQuery.mockReturnValue({
    data: {
      id: 42,
      theater: { id: 1, name: 'The Globe' },
      play,
      start_date: null,
      end_date: null,
      lines_per_minute: 20,
      production_phases: [],
    },
  })
  render(<ProductionInfoRoute />)
}

describe('ProductionInfoRoute', () => {
  it('renders without a play while the play is still being copied', () => {
    setup(null)
    expect(screen.getByText('Lines per minute')).toBeInTheDocument()
    expect(screen.queryByText('Estimated run time')).not.toBeInTheDocument()
  })

  it('shows the estimated run time once the play has lines', () => {
    setup({ id: 7, title: 'Hamlet', has_lines: true, new_line_count: 3000 })
    expect(screen.getByText('Estimated run time')).toBeInTheDocument()
  })
})
