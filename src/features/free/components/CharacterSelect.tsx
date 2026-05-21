import { useState } from 'react'
import { useFreePlayStore, selectCharactersAll } from '../store/freePlayStore'

interface CharacterOption {
  id: number
  name: string
}

interface CharacterSelectProps {
  characters?: { id: number; name: string; type?: string }[]
  onBlur: (selected: CharacterOption[]) => void
  selectedCharacter?: CharacterOption[]
}

export function CharacterSelect({ characters, onBlur, selectedCharacter }: CharacterSelectProps) {
  const charactersAll = useFreePlayStore(selectCharactersAll)
  const available = characters ?? charactersAll
  const [value, setValue] = useState<string>(
    selectedCharacter?.[0] ? String(selectedCharacter[0].id) : ''
  )

  if (!available.length) {
    return <div className="text-sm text-gray-500">Loading characters…</div>
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue(e.target.value)
  }

  function handleBlur() {
    const found = available.find(c => String(c.id) === value)
    onBlur(found ? [{ id: found.id, name: found.name }] : [])
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-0.5">Character</label>
      <select
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus
        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Choose a character…</option>
        {available.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
