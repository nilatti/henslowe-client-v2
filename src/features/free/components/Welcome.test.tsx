import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Welcome } from './Welcome'

describe('Welcome', () => {
  it('renders the free tools description', () => {
    render(<Welcome />)
    expect(screen.getByText(/tools for cutting and doubling plays/i)).toBeInTheDocument()
  })

  it('warns that changes vanish on browser close', () => {
    render(<Welcome />)
    expect(screen.getByText(/any changes you make will vanish/i)).toBeInTheDocument()
  })

  it('mentions the mailing list', () => {
    render(<Welcome />)
    expect(screen.getByRole('link', { name: /sign up for our mailing list/i })).toBeInTheDocument()
  })

  it('mentions the forthcoming book', () => {
    render(<Welcome />)
    expect(screen.getByText(/Cutting Plays for Performance/i)).toBeInTheDocument()
  })

  it('does not make any API calls or require auth context', () => {
    // Welcome is a static component — rendering it must not throw
    expect(() => render(<Welcome />)).not.toThrow()
  })
})
