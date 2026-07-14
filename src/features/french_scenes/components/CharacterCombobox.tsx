import { useState, useRef, useEffect, useCallback } from 'react'
import { useCreateCharacter } from '../../plays/api/characters'

type OptionType = 'character' | 'character_group'

interface ItemOption {
  kind: 'item'
  id: number
  name: string
  type: OptionType
}

interface CreateOption {
  kind: 'create'
  name: string
}

type Option = ItemOption | CreateOption

interface CharacterComboboxProps {
  characters: { id: number; name: string }[]
  characterGroups: { id: number; name: string }[]
  excludeCharacterIds: Set<number>
  excludeGroupIds: Set<number>
  playId: number
  onSelect: (type: OptionType, id: number) => void
  disabled?: boolean
}

export function CharacterCombobox({
  characters,
  characterGroups,
  excludeCharacterIds,
  excludeGroupIds,
  playId,
  onSelect,
  disabled,
}: CharacterComboboxProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const createCharacter = useCreateCharacter(playId)

  const q = query.trim().toLowerCase()

  const availableChars = characters.filter(c => !excludeCharacterIds.has(c.id))
  const availableGroups = characterGroups.filter(cg => !excludeGroupIds.has(cg.id))

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)

  const filteredChars = (q
    ? availableChars.filter(c => c.name.toLowerCase().includes(q))
    : availableChars
  ).slice().sort(byName)
  const filteredGroups = (q
    ? availableGroups.filter(cg => cg.name.toLowerCase().includes(q))
    : availableGroups
  ).slice().sort(byName)

  const options: Option[] = [
    ...filteredChars.map(c => ({ kind: 'item' as const, id: c.id, name: c.name, type: 'character' as const })),
    ...filteredGroups.map(cg => ({ kind: 'item' as const, id: cg.id, name: cg.name, type: 'character_group' as const })),
  ]

  const trimmed = query.trim()
  const exactMatch = trimmed && availableChars.some(c => c.name.toLowerCase() === trimmed.toLowerCase())
  if (trimmed && !exactMatch) {
    options.push({ kind: 'create', name: trimmed })
  }

  const clampedHighlighted = Math.min(highlighted, Math.max(0, options.length - 1))

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[clampedHighlighted] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [clampedHighlighted])

  const handleSelect = useCallback(async (option: Option) => {
    if (option.kind === 'create') {
      setIsCreating(true)
      try {
        const newChar = await createCharacter.mutateAsync({
          name: option.name,
          play_id: playId,
          age: null,
          gender: null,
          description: null,
        } as Parameters<typeof createCharacter.mutateAsync>[0])
        onSelect('character', (newChar as { id: number }).id)
      } finally {
        setIsCreating(false)
      }
    } else {
      onSelect(option.type, option.id)
    }
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [createCharacter, playId, onSelect])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIsOpen(true)
        setHighlighted(0)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted(h => Math.min(h + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (options[clampedHighlighted]) {
          void handleSelect(options[clampedHighlighted])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const isDisabled = disabled || isCreating

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          setIsOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={isCreating ? 'Creating…' : 'Search characters…'}
        disabled={isDisabled}
        autoFocus
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto"
        >
          {options.map((option, i) => {
            const key = option.kind === 'create' ? '__create__' : `${option.type}-${option.id}`
            const isHighlighted = i === clampedHighlighted
            const isFirstGroupOption =
              filteredChars.length > 0 && filteredGroups.length > 0 && i === filteredChars.length
            return (
              <li
                key={key}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  isHighlighted ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onMouseDown={e => {
                  e.preventDefault()
                  void handleSelect(option)
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                {isFirstGroupOption && (
                  <p className="-mx-3 -mt-2 mb-1.5 px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100">
                    Character Groups
                  </p>
                )}
                {option.kind === 'create' ? (
                  <>Add &ldquo;<strong>{option.name}</strong>&rdquo; as new character</>
                ) : (
                  option.name
                )}
              </li>
            )
          })}
        </ul>
      )}

      {isOpen && options.length === 0 && !trimmed && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-400 italic">
          All characters already added
        </div>
      )}
    </div>
  )
}
