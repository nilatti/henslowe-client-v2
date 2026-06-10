import { useState, useRef, useEffect, useCallback } from 'react'
import { buildUserName, sortUsers } from '../../../utils/actorUtils'
import type { User } from '../../../utils/actorUtils'

interface UserComboboxProps {
  users: User[]
  value: number
  onChange: (id: number) => void
  disabled?: boolean
}

export function UserCombobox({ users, value, onChange, disabled }: UserComboboxProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedUser = users.find(u => u.id === value) ?? null
  const displayValue = isOpen ? query : (selectedUser ? buildUserName(selectedUser) : '')

  const q = query.trim().toLowerCase()
  const sorted = sortUsers(users)
  const filtered = q ? sorted.filter(u => buildUserName(u).toLowerCase().includes(q)) : sorted
  const clamped = Math.min(highlighted, Math.max(0, filtered.length - 1))

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[clamped] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [clamped])

  const handleSelect = useCallback((user: User) => {
    onChange(user.id)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onChange])

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
        setHighlighted(h => Math.min(h + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted(h => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[clamped]) handleSelect(filtered[clamped])
        break
      case 'Escape':
        setIsOpen(false)
        setQuery('')
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={e => {
          setQuery(e.target.value)
          setIsOpen(true)
          setHighlighted(0)
          if (!e.target.value) onChange(0)
        }}
        onFocus={() => {
          setQuery('')
          setIsOpen(true)
          setHighlighted(0)
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search people…"
        disabled={disabled}
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto"
        >
          {filtered.map((user, i) => (
            <li
              key={user.id}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === clamped ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onMouseDown={e => {
                e.preventDefault()
                handleSelect(user)
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              {buildUserName(user)}
            </li>
          ))}
        </ul>
      )}

      {isOpen && filtered.length === 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-400 italic">
          No matches
        </div>
      )}
    </div>
  )
}
