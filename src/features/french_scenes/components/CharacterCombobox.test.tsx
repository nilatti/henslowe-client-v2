import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CharacterCombobox } from './CharacterCombobox'

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

vi.mock('../../plays/api/characters', () => ({
  useCreateCharacter: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 99, name: 'Ghost' }),
  }),
}))

const characters = [
  { id: 1, name: 'Hamlet' },
  { id: 2, name: 'Ophelia' },
]

const groups = [{ id: 10, name: 'Guards' }]

function renderCombobox(props: Partial<React.ComponentProps<typeof CharacterCombobox>> = {}) {
  const onSelect = vi.fn()
  render(
    <CharacterCombobox
      characters={characters}
      characterGroups={groups}
      excludeCharacterIds={new Set()}
      excludeGroupIds={new Set()}
      playId={1}
      onSelect={onSelect}
      {...props}
    />,
  )
  return { onSelect, input: screen.getByPlaceholderText('Search characters…') }
}

describe('CharacterCombobox', () => {
  it('shows all characters when focused (no filter)', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)

    expect(screen.getByText('Hamlet')).toBeInTheDocument()
    expect(screen.getByText('Ophelia')).toBeInTheDocument()
  })

  it('filters characters by typed text', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'ham')

    expect(screen.getByText('Hamlet')).toBeInTheDocument()
    expect(screen.queryByText('Ophelia')).not.toBeInTheDocument()
  })

  it('excludes characters whose IDs are in excludeCharacterIds', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox({ excludeCharacterIds: new Set([1]) })

    await user.click(input)

    expect(screen.queryByText('Hamlet')).not.toBeInTheDocument()
    expect(screen.getByText('Ophelia')).toBeInTheDocument()
  })

  it('shows character groups under a "Character Groups" header, separate from characters', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)

    expect(screen.getByText('Guards')).toBeInTheDocument()
    expect(screen.getByText('Character Groups')).toBeInTheDocument()
  })

  it('sorts characters and character groups alphabetically', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox({
      characters: [
        { id: 1, name: 'Zed' },
        { id: 2, name: 'Anna' },
      ],
      characterGroups: [
        { id: 10, name: 'Zealots' },
        { id: 11, name: 'Attendants' },
      ],
    })

    await user.click(input)

    const items = screen.getAllByRole('listitem').map(li => li.textContent)
    expect(items).toEqual(['Anna', 'Zed', 'Character GroupsAttendants', 'Zealots'])
  })

  it('calls onSelect("character", id) when Enter is pressed on a highlighted character', async () => {
    const user = userEvent.setup()
    const { onSelect, input } = renderCombobox()

    await user.click(input)
    // First item (index 0) is highlighted by default — Hamlet
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('character', 1)
  })

  it('calls onSelect("character", id) when a character is clicked', async () => {
    const user = userEvent.setup()
    const { onSelect, input } = renderCombobox()

    await user.click(input)
    await user.click(screen.getByText('Ophelia'))

    expect(onSelect).toHaveBeenCalledWith('character', 2)
  })

  it('shows "Add … as new character" option when query has no exact match', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'Ghost')

    const addOption = screen.getAllByRole('listitem').find(
      li => li.textContent?.includes('Ghost') && li.textContent?.includes('as new character'),
    )
    expect(addOption).toBeInTheDocument()
  })

  it('does NOT show "Add" option when query exactly matches an existing character name (case-insensitive)', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'hamlet')

    const addOption = screen.getAllByRole('listitem').find(
      li => li.textContent?.includes('as new character'),
    )
    expect(addOption).toBeUndefined()
  })

  it('calls onSelect("character", 99) when the "Add" option is clicked', async () => {
    const user = userEvent.setup()
    const { onSelect, input } = renderCombobox()

    await user.click(input)
    await user.type(input, 'Ghost')
    const addOption = screen.getAllByRole('listitem').find(
      li => li.textContent?.includes('Ghost') && li.textContent?.includes('as new character'),
    )!
    await user.click(addOption)

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('character', 99)
    })
  })

  it('closes the dropdown on Escape', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.click(input)
    expect(screen.getByText('Hamlet')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText('Hamlet')).not.toBeInTheDocument()
  })

  it('shows "All characters already added" when all characters are excluded and query is empty', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox({
      excludeCharacterIds: new Set([1, 2]),
      excludeGroupIds: new Set([10]),
    })

    await user.click(input)

    expect(screen.getByText('All characters already added')).toBeInTheDocument()
  })
})
