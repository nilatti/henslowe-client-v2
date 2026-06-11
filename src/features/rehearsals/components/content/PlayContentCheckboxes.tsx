import type { TextUnitWithOnStages } from '../../api/rehearsals'
import { minutesPerPage } from '../../utils/rehearsalMetrics'

interface PlayContentCheckboxesProps {
  playContent: TextUnitWithOnStages[]
  onChange: (id: number) => void
}

export function PlayContentCheckboxes({
  playContent,
  onChange,
}: PlayContentCheckboxesProps) {
  return (
    <div className="space-y-2">
      {playContent.map(item => (
        <label
          key={item.id}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            item.isScheduled
              ? 'border-blue-400 bg-blue-50'
              : item.isRecommended === false
              ? 'border-amber-200 bg-amber-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="checkbox"
            checked={item.isScheduled ?? false}
            onChange={() => onChange(item.id)}
            className="mt-0.5 rounded border-gray-300"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {item.heading ?? item.pretty_name ?? `${item.number}`}
              </span>
              {item.isRecommended === false && (
                <span className="text-xs text-amber-600 font-medium">
                  Conflict
                </span>
              )}
            </div>
            {item.furtherInfo && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                Called: {item.furtherInfo}
              </div>
            )}
            {(() => {
              const mpp = minutesPerPage(item)
              return mpp != null ? (
                <div className="text-xs text-gray-400 mt-0.5">
                  {mpp.toFixed(1)} min/pg
                </div>
              ) : null
            })()}
            {item.isRecommended === false &&
              (item.reasonsForRecommendation?.unavailableUsers?.length ?? 0) > 0 && (
                <div className="text-xs text-amber-600 mt-0.5">
                  Unavailable:{' '}
                  {item.reasonsForRecommendation!.unavailableUsers
                    .map(u => `${u.first_name} ${u.last_name}`)
                    .join(', ')}
                </div>
              )}
          </div>
        </label>
      ))}
    </div>
  )
}
