import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserCombobox } from './UserCombobox'

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const users = [
  { id: 1, email: 'alice@example.com', first_name: 'Alice', last_name: 'Zebra' },
  { id: 2, email: 'bob@example.com', first_name: 'Bob', last_name: 'Apple' },
  { id: 3, email: 'carol@example.com', first_name: 'Carol', last_name: 'Mango' },
]

function renderCombobox(props: Partial<React.ComponentProps<typeof UserCombobox>> = {}) {
  const onChange = vi.fn()
  render(
    <UserCombobox
      users={users}
      value={0}
      onChange={onChange}
      {...props}
    />,
  )
  return { onChange, input: screen.getByPlaceholderText('Search people…') }
}

describe('UserCombobox', () => {
  it('shows all users when focused, sorted by last name', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Bob Apple')
    expect(items[1]).toHaveTextContent('Carol Mango')
    expect(items[2]).toHaveTextContent('Alice Zebra')
  })

  it('filters by typed text (case-insensitive)', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'carol')

    expect(screen.getByText('Carol Mango')).toBeInTheDocument()
    expect(screen.queryByText('Alice Zebra')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Apple')).not.toBeInTheDocument()
  })

  it('calls onChange with the user id when Enter is pressed on the highlighted item', async () => {
    const user = userEvent.setup()
    const { onChange, input } = renderCombobox()

    await user.click(input)
    // First item by last-name sort is Bob Apple (id 2)
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('calls onChange with the user id when a user is clicked', async () => {
    const user = userEvent.setup()
    const { onChange, input } = renderCombobox()

    await user.click(input)
    await user.click(screen.getByText('Carol Mango'))

    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('navigates with arrow keys and selects with Enter', async () => {
    const user = userEvent.setup()
    const { onChange, input } = renderCombobox()

    await user.click(input)
    await user.keyboard('{ArrowDown}') // highlight index 1 (Carol Mango)
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    expect(screen.getByText('Bob Apple')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText('Bob Apple')).not.toBeInTheDocument()
  })

  it('shows "No matches" when the query matches nothing', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'zzznomatch')

    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('displays the selected user name when closed', () => {
    renderCombobox({ value: 1 })
    expect(screen.getByDisplayValue('Alice Zebra')).toBeInTheDocument()
  })

  it('calls onChange(0) when the query is cleared', async () => {
    const user = userEvent.setup()
    const { onChange, input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'ali')
    await user.clear(input)

    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('shows all users when focused even when a value is already selected', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox({ value: 2 })

    await user.click(input)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
