import { useForm } from '@tanstack/react-form'
import { Button } from '../../../../components/ui'
import type { StageExit } from '../../types/stageExit'

interface StageExitFormProps {
  stageExit?: StageExit
  onSubmit: (data: { name: string }) => void
  onCancel: () => void
  isPending?: boolean
}

export function StageExitForm({ stageExit, onSubmit, onCancel, isPending }: StageExitFormProps) {
  const form = useForm({
    defaultValues: { name: stageExit?.name ?? '' },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="flex items-center gap-2"
    >
      <form.Field name="name">
        {field => (
          <input
            value={field.state.value}
            onChange={e => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder="Stage exit name"
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </form.Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  )
}
