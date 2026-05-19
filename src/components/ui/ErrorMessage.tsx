export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      {message}
    </div>
  )
}
