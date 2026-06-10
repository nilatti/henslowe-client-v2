import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('defaults to type="button"', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toHaveAttribute('type', 'button')
  })

  it('respects explicit type="submit"', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit')
  })

  it('renders children', () => {
    render(<Button>Hello world</Button>)
    expect(screen.getByRole('button', { name: 'Hello world' })).toBeInTheDocument()
  })
})
