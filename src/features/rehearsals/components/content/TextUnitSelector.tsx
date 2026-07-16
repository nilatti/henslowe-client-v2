import { useUpdateRehearsal } from '../../api/rehearsals'
import type { RehearsalWithDetails } from '../../types/rehearsal'
import { Button, Card } from '../../../../components/ui'

interface TextUnitSelectorProps {
  rehearsal: RehearsalWithDetails
  productionId: number
  playId: number
  onClose: () => void
}

const OPTIONS = [
  { value: 'acts', label: 'Acts', description: 'Schedule by act (broad)' },
  { value: 'scenes', label: 'Scenes', description: 'Schedule by scene (recommended)' },
  { value: 'french_scenes', label: 'French Scenes', description: 'Schedule by french scene (most granular)' },
] as const

export function TextUnitSelector({
  rehearsal,
  productionId,
  playId,
  onClose,
}: TextUnitSelectorProps) {
  const update = useUpdateRehearsal(productionId, playId)

  const handleSelect = async (textUnit: 'acts' | 'scenes' | 'french_scenes') => {
    await update.mutateAsync({ id: rehearsal.id, text_unit: textUnit })
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Choose scheduling granularity
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        How do you want to schedule content for this rehearsal?
      </p>
      <div className="space-y-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={update.isPending}
            className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="text-sm font-medium text-gray-900">{opt.label}</div>
            <div className="text-xs text-gray-500">{opt.description}</div>
          </button>
        ))}
      </div>
      <Button variant="secondary" className="mt-4" onClick={onClose}>
        Cancel
      </Button>
    </Card>
  )
}
