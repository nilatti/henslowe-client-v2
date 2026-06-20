import { useRef, useState } from 'react'
import { useUploadHeadshot } from '../api/users'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

interface HeadshotUploadProps {
  userId: number
  currentUrl: string | null | undefined
}

export function HeadshotUpload({ userId, currentUrl }: HeadshotUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadHeadshot(userId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setValidationError(null)
    if (!ALLOWED_TYPES.includes(f.type)) {
      setValidationError('Only JPEG, PNG, GIF, and WebP images are allowed.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (f.size > MAX_BYTES) {
      setValidationError('File must be smaller than 5 MB.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleUpload() {
    if (!file) return
    const formData = new FormData()
    formData.append('headshot', file)
    await upload.mutateAsync(formData)
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleCancel() {
    setFile(null)
    setPreview(null)
    setValidationError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="flex flex-col items-center gap-3">
      {displayUrl ? (
        <img
          src={displayUrl}
          alt="Profile headshot"
          className="w-32 h-32 rounded-full object-cover ring-2 ring-gray-200"
        />
      ) : (
        <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-5xl select-none ring-2 ring-gray-200">
          &#128100;
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
          {currentUrl ? 'Change photo' : 'Upload photo'}
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
