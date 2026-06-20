import { useState } from 'react'
import { useBuildConflictSchedule } from '../api/conflicts'
import { Button, Card } from '../../../components/ui'
import { USER_CONFLICT_REASONS, SPACE_CONFLICT_REASONS, DAYS_OF_WEEK } from '../../../utils/constants'
import { firstLetterUpcase } from '../../../utils/stringUtils'

interface ConflictPatternFormProps {
  userId?: number
  spaceId?: number
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
}

export function ConflictPatternForm({
  userId,
  spaceId,
  invalidateKey,
  onSuccess,
  onCancel,
}: ConflictPatternFormProps) {
  // build_conflict_schedule creates the pattern AND kicks off the worker in one call
  const buildSchedule = useBuildConflictSchedule(
    userId ?? spaceId ?? 0,
    userId ? 'user' : 'space',
    invalidateKey
  )
  const [submitted, setSubmitted] = useState(false)
  const reasons = userId ? USER_CONFLICT_REASONS : SPACE_CONFLICT_REASONS

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([])
  const [category, setCategory] = useState('')

  const toggleDay = (day: string) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const tzOffset = (() => {
    const offset = new Date().getTimezoneOffset()
    const sign = offset <= 0 ? '+' : '-'
    const abs = Math.abs(offset)
    return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  })()

  const handleSubmit = async () => {
    // Send days_of_week as array — server stores it as JSON string
    // start_time/end_time are plain "HH:MM" for display; utc_offset is sent separately
    // so the worker can compute correct UTC datetimes without polluting the display string
    await buildSchedule.mutateAsync({
      category,
      days_of_week: daysOfWeek,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      utc_offset: tzOffset,
      user_id: userId ?? null,
      space_id: spaceId ?? null,
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-700 mb-2">
          Conflict pattern saved. Individual conflicts are being generated —
          this may take a moment.
        </p>
        <Button onClick={onSuccess}>Done</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 italic">
        Create a recurring conflict pattern. Individual conflict records will be
        generated automatically. Run this multiple times for different patterns.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I have a conflict every
        </label>
        <div className="flex flex-wrap gap-3">
          {DAYS_OF_WEEK.map(day => (
            <label
              key={day}
              className="flex items-center gap-1 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={daysOfWeek.includes(day)}
                onChange={() => toggleDay(day)}
                className="rounded border-gray-300"
              />
              <span className="capitalize">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <div className="flex flex-wrap gap-3">
          {reasons.map(reason => (
            <label
              key={reason}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="radio"
                name="pattern_category"
                value={reason}
                checked={category === reason}
                onChange={() => setCategory(reason)}
                className="border-gray-300"
              />
              {firstLetterUpcase(reason)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            !startDate || !endDate || !startTime || !endTime ||
            daysOfWeek.length === 0 || !category || buildSchedule.isPending
          }
        >
          {buildSchedule.isPending ? 'Saving...' : 'Save pattern'}
        </Button>
      </div>
    </div>
  )
}
