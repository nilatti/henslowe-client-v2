import { useState } from 'react'
import { Download } from 'lucide-react'
import type { ScriptAct } from '../types/script'
import { generateCutScript, generateMarkedScript } from '../utils/exportScript'

interface ExportButtonsProps {
  act: ScriptAct
  playTitle: string
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportButtons({ act, playTitle }: ExportButtonsProps) {
  const [cutLoading, setCutLoading] = useState(false)
  const [markedLoading, setMarkedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const safeTitle = playTitle.replace(/[^a-zA-Z0-9_-]/g, '_')

  const handleCutScript = async () => {
    setCutLoading(true)
    setError(null)
    try {
      const blob = await generateCutScript(act, playTitle)
      triggerDownload(blob, `${safeTitle}_Act${act.number}_cut_script.docx`)
    } catch {
      setError('Failed to generate cut script.')
    } finally {
      setCutLoading(false)
    }
  }

  const handleMarkedScript = async () => {
    setMarkedLoading(true)
    setError(null)
    try {
      const blob = await generateMarkedScript(act, playTitle)
      triggerDownload(blob, `${safeTitle}_Act${act.number}_marked_script.docx`)
    } catch {
      setError('Failed to generate marked script.')
    } finally {
      setMarkedLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCutScript}
        disabled={cutLoading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {cutLoading ? (
          <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download Cut Script
      </button>
      <button
        onClick={handleMarkedScript}
        disabled={markedLoading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {markedLoading ? (
          <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download Marked Script
      </button>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}
