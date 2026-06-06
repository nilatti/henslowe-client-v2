import { useState } from 'react'

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  confirmLabel?: string
  isDestructive?: boolean
}
export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  isDestructive = false,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsPending(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError((e as Error)?.message || 'Something went wrong')
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-gray-700 mb-6">{message}</p>
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className={`px-4 py-2 text-sm rounded-md text-white disabled:opacity-50 ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
