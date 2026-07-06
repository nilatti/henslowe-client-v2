import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockMutateAsync, mockUseUploadHeadshot } = vi.hoisted(() => {
  const mockMutateAsync = vi.fn().mockResolvedValue({})
  return {
    mockMutateAsync,
    mockUseUploadHeadshot: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false, isError: false })),
  }
})

vi.mock('../api/users', () => ({
  useUploadHeadshot: mockUseUploadHeadshot,
}))

import { HeadshotUpload } from './HeadshotUpload'

function pngFile(name = 'photo.png', sizeBytes = 100) {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/png' })
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

beforeEach(() => {
  mockMutateAsync.mockClear()
  mockUseUploadHeadshot.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false, isError: false })
})

describe('HeadshotUpload', () => {
  it('shows a placeholder and "Upload photo" when there is no current headshot', () => {
    render(<HeadshotUpload userId={1} currentUrl={null} />)
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows the current headshot and "Change photo" when one exists', () => {
    render(<HeadshotUpload userId={1} currentUrl="https://example.com/headshot.png" />)
    expect(screen.getByRole('button', { name: 'Change photo' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /profile headshot/i })).toHaveAttribute(
      'src',
      'https://example.com/headshot.png'
    )
  })

  it('shows Upload/Cancel buttons after selecting a valid image', () => {
    const { container } = render(<HeadshotUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile()] } })
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('rejects a disallowed file type', () => {
    const { container } = render(<HeadshotUpload userId={1} currentUrl={null} />)
    const badFile = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(getFileInput(container), { target: { files: [badFile] } })
    expect(screen.getByText(/only jpeg, png, gif, and webp images are allowed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
  })

  it('rejects a file over 5MB', () => {
    const { container } = render(<HeadshotUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile('big.png', 6 * 1024 * 1024)] } })
    expect(screen.getByText(/file must be smaller than 5 mb/i)).toBeInTheDocument()
  })

  it('uploads the selected file as FormData under the "headshot" key', async () => {
    const user = userEvent.setup()
    const { container } = render(<HeadshotUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile()] } })
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledOnce())
    const formData = mockMutateAsync.mock.calls[0][0] as FormData
    expect(formData.get('headshot')).toBeInstanceOf(File)
    expect((formData.get('headshot') as File).name).toBe('photo.png')
  })

  it('resets to the upload prompt after a successful upload', async () => {
    const user = userEvent.setup()
    const { container } = render(<HeadshotUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile()] } })
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
  })

  it('cancels the pending selection without uploading', async () => {
    const user = userEvent.setup()
    const { container } = render(<HeadshotUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pngFile()] } })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
  })

  it('shows an upload-failed message when the mutation errors', () => {
    mockUseUploadHeadshot.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false, isError: true })
    render(<HeadshotUpload userId={1} currentUrl={null} />)
    expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
  })
})
