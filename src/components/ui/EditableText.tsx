import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface EditableTextProps {
  value: string
  onSave: (value: string) => void
  as?: 'h1' | 'p' | 'span'
  className?: string
  multiline?: boolean
  required?: boolean
  placeholder?: ReactNode
}

export function EditableText({
  value,
  onSave,
  as = 'p',
  className = '',
  multiline = false,
  required = false,
  placeholder,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!isEditing) setDraft(value)
  }, [value, isEditing])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(draft)
    setIsEditing(false)
  }

  const Tag = as as React.ElementType

  if (isEditing) {
    if (multiline) {
      return (
        <form className="space-y-2" onSubmit={handleSubmit}>
          <textarea
            autoFocus
            rows={5}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            required={required}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </form>
      )
    }
    return (
      <form className="flex-1 flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          autoFocus
          className={`flex-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent ${className}`}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          required={required}
        />
        <Button type="submit" variant="primary">Save</Button>
        <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
      </form>
    )
  }

  return (
    <Tag
      className={`cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 ${className}`}
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to edit"
    >
      {value || placeholder}
    </Tag>
  )
}
