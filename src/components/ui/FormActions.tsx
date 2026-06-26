import { Button } from './Button'

interface FormActionsProps {
  isSubmitting: boolean
  isEditing: boolean
  onCancel: () => void
  submitLabel?: string
  submitDisabled?: boolean
  className?: string
}

export function FormActions({
  isSubmitting,
  isEditing,
  onCancel,
  submitLabel,
  submitDisabled,
  className,
}: FormActionsProps) {
  return (
    <div className={`flex gap-3 justify-end pt-2${className ? ` ${className}` : ''}`}>
      <Button variant="secondary" type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting || submitDisabled}>
        {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : (submitLabel ?? 'Create')}
      </Button>
    </div>
  )
}
