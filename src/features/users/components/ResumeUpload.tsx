import { useRef, useState } from 'react'
import { useUploadResume } from '../api/users'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 5 * 1024 * 1024

interface ResumeUploadProps {
  userId: number
  currentUrl: string | null | undefined
}

export function ResumeUpload({ userId, currentUrl }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadResume(userId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setValidationError(null)
    if (!ALLOWED_TYPES.includes(f.type)) {
      setValidationError('Only PDF, DOC, and DOCX files are allowed.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (f.size > MAX_BYTES) {
      setValidationError('File must be smaller than 5 MB.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    const formData = new FormData()
    formData.append('resume', file)
    await upload.mutateAsync(formData)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleCancel() {
    setFile(null)
    setValidationError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {currentUrl && !file && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View resume
        </a>
      )}
      {file && (
        <p className="text-sm text-gray-600">{file.name}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileChange}
      />
      {file ? (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={upload.isPending}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {upload.isPending ? 'Uploading...' : 'Upload'}
          </button>
          <button
            onClick={handleCancel}
            disabled={upload.isPending}
            className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {currentUrl ? 'Change resume' : 'Upload resume'}
        </button>
      )}
      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}
      {upload.isError && !validationError && (
        <p className="text-sm text-red-600">Upload failed. Please try again.</p>
      )}
    </div>
  )
}
