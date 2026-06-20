import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('../api/jobs', () => ({
  useUpdateJob: () => ({ mutateAsync: mockMutateAsync }),
}))

vi.mock('../utils/jobUtils', () => ({
  getActorsAndAuditioners: () => [
    { id: 1, email: 'alice@example.com', first_name: 'Alice', last_name: 'Zebra', preferred_name: null, fake: false },
    { id: 2, email: 'bob@example.com', first_name: 'Bob', last_name: 'Apple', preferred_name: null, fake: false },
  ],
}))

// Render as a number input so tests can set from/to independently
vi.mock('./UserCombobox', () => ({
  UserCombobox: ({ value, onChange }: { value: number; onChange: (id: number) => void }) => (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
    />
  ),
}))

import { CastingReassign } from './CastingReassign'
import { ACTOR_SPECIALIZATION_ID } from '../../../utils/constants'

const jobs = [
  { id: 10, user_id: 1, specialization_id: ACTOR_SPECIALIZATION_ID, character_id: 3, production_id: 1 },
  { id: 11, user_id: 1, specialization_id: ACTOR_SPECIALIZATION_ID, character_id: 4, production_id: 1 },
  { id: 12, user_id: 2, specialization_id: ACTOR_SPECIALIZATION_ID, character_id: 5, production_id: 1 },
] as any[]

function renderPanel(onClose = vi.fn()) {
  render(<CastingReassign jobs={jobs} invalidateKey={[]} onClose={onClose} />)
  const inputs = screen.getAllByRole('spinbutton')
  return { fromInput: inputs[0], toInput: inputs[1], onClose }
}

beforeEach(() => mockMutateAsync.mockReset().mockResolvedValue(undefined))

describe('CastingReassign', () => {
  it('renders From and To actor comboboxes', () => {
    renderPanel()
    expect(screen.getByText('From actor')).toBeInTheDocument()
    expect(screen.getByText('To actor')).toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
  })

  it('"Reassign all roles" is disabled when neither actor is selected', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: 'Reassign all roles' })).toBeDisabled()
  })

  it('"Reassign all roles" is disabled when only "from" is selected', () => {
    const { fromInput } = renderPanel()
    fireEvent.change(fromInput, { target: { value: '1' } })
    expect(screen.getByRole('button', { name: 'Reassign all roles' })).toBeDisabled()
  })

  it('does not call mutateAsync when from and to are the same actor', async () => {
    const user = userEvent.setup()
    const { fromInput, toInput } = renderPanel()
    fireEvent.change(fromInput, { target: { value: '1' } })
    fireEvent.change(toInput, { target: { value: '1' } })
    await user.click(screen.getByRole('button', { name: 'Reassign all roles' }))
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('"Reassign all roles" is enabled when different from and to are selected', () => {
    const { fromInput, toInput } = renderPanel()
    fireEvent.change(fromInput, { target: { value: '1' } })
    fireEvent.change(toInput, { target: { value: '2' } })
    expect(screen.getByRole('button', { name: 'Reassign all roles' })).not.toBeDisabled()
  })

  it('calls mutateAsync for each job belonging to the "from" actor', async () => {
    const user = userEvent.setup()
    const { fromInput, toInput } = renderPanel()
    fireEvent.change(fromInput, { target: { value: '1' } })
    fireEvent.change(toInput, { target: { value: '2' } })
    await user.click(screen.getByRole('button', { name: 'Reassign all roles' }))
    expect(mockMutateAsync).toHaveBeenCalledTimes(2)
    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 10, user_id: 2 })
    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 11, user_id: 2 })
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })
})
