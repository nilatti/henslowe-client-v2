import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useSuspenseQuery: mockUseSuspenseQuery,
  }
})

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ to, params, children, ...rest }: {
      to: string
      params?: Record<string, string>
      children: React.ReactNode
      [key: string]: unknown
    }) => (
      <a href={to.replace(/\$(\w+)/, (_, k) => params?.[k] ?? k)} {...rest}>
        {children}
      </a>
    ),
  }
})

// Mock child components so ScriptContent doesn't blow up when has_lines=true
vi.mock('../../../../features/script/components/ExportButtons', () => ({
  ExportButtons: () => <div data-testid="export-buttons" />,
}))
vi.mock('../../../../features/script/components/PartScripts/PartScriptContainer', () => ({
  default: () => <div data-testid="part-script-container" />,
}))
vi.mock('../../../../features/script/components/PartScripts/PartScriptExportButtons', () => ({
  PartScriptExportButtons: () => <div data-testid="part-script-export-buttons" />,
}))

import { Route } from './script'

const ScriptRoute = Route.options.component as React.ComponentType

function setup(hasLines: boolean, playId = 7) {
  vi.spyOn(Route, 'useParams').mockReturnValue({ productionId: '42' } as never)
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    const root = queryKey[0]
    if (root === 'productions') {
      return { data: { play: { id: playId, title: 'The Tempest', has_lines: hasLines } } }
    }
    if (root === 'plays') {
      return { data: { acts: [], characters: [], character_groups: [] } }
    }
    // jobs query
    return { data: [] }
  })
  render(<ScriptRoute />)
}

describe('script tab — no lines', () => {
  it('shows the "no script" message', () => {
    setup(false)
    expect(screen.getByText(/no script has been added/i)).toBeInTheDocument()
  })

  it('shows a link to the play structure page', () => {
    setup(false, 7)
    const link = screen.getByRole('link', { name: /play structure/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/plays/7')
  })

  it('does not show View/edit script link', () => {
    setup(false)
    expect(screen.queryByRole('link', { name: /view\/edit script/i })).not.toBeInTheDocument()
  })

  it('does not show Part scripts link', () => {
    setup(false)
    expect(screen.queryByRole('link', { name: /part scripts/i })).not.toBeInTheDocument()
  })

  it('does not show Word clouds link', () => {
    setup(false)
    expect(screen.queryByRole('link', { name: /word clouds/i })).not.toBeInTheDocument()
  })
})

describe('script tab — with lines', () => {
  it('does not show the "no script" message', () => {
    setup(true)
    expect(screen.queryByText(/no script has been added/i)).not.toBeInTheDocument()
  })

  it('shows the full set of script links', () => {
    setup(true)
    expect(screen.getByRole('link', { name: /play structure/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view\/edit script/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /part scripts/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /word clouds/i })).toBeInTheDocument()
  })
})
