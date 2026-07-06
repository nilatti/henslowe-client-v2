import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockMutateAsync, mockUseUploadResume } = vi.hoisted(() => {
  const mockMutateAsync = vi.fn().mockResolvedValue({})
  return {
    mockMutateAsync,
    mockUseUploadResume: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false, isError: false })),
  }
})

vi.mock('../api/users', () => ({
  useUploadResume: mockUseUploadResume,
}))

import { ResumeUpload } from './ResumeUpload'

function pdfFile(name = 'resume.pdf', sizeBytes = 100) {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'application/pdf' })
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

beforeEach(() => {
  mockMutateAsync.mockClear()
  mockUseUploadResume.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false, isError: false })
})

describe('ResumeUpload', () => {
  it('shows "Upload resume" and no link when there is no current resume', () => {
    render(<ResumeUpload userId={1} currentUrl={null} />)
    expect(screen.getByRole('button', { name: 'Upload resume' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view resume/i })).not.toBeInTheDocument()
  })

  it('shows a "View resume" link and "Change resume" when one exists', () => {
    render(<ResumeUpload userId={1} currentUrl="https://example.com/resume.pdf" />)
    expect(screen.getByRole('link', { name: /view resume/i })).toHaveAttribute(
      'href',
      'https://example.com/resume.pdf'
    )
    expect(screen.getByRole('button', { name: 'Change resume' })).toBeInTheDocument()
  })

  it('shows Upload/Cancel buttons and the filename after selecting a valid resume', () => {
    const { container } = render(<ResumeUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pdfFile()] } })
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('rejects a disallowed file type', () => {
    const { container } = render(<ResumeUpload userId={1} currentUrl={null} />)
    const badFile = new File(['hello'], 'photo.png', { type: 'image/png' })
    fireEvent.change(getFileInput(container), { target: { files: [badFile] } })
    expect(screen.getByText(/only pdf, doc, and docx files are allowed/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
  })

  it('rejects a file over 5MB', () => {
    const { container } = render(<ResumeUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pdfFile('big.pdf', 6 * 1024 * 1024)] } })
    expect(screen.getByText(/file must be smaller than 5 mb/i)).toBeInTheDocument()
  })

  it('uploads the selected file as FormData under the "resume" key', async () => {
    const user = userEvent.setup()
    const { container } = render(<ResumeUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pdfFile()] } })
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledOnce())
    const formData = mockMutateAsync.mock.calls[0][0] as FormData
    expect(formData.get('resume')).toBeInstanceOf(File)
    expect((formData.get('resume') as File).name).toBe('resume.pdf')
  })

  it('resets to the upload prompt after a successful upload', async () => {
    const user = userEvent.setup()
    const { container } = render(<ResumeUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pdfFile()] } })
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Upload resume' })).toBeInTheDocument()
  })

  it('cancels the pending selection without uploading', async () => {
    const user = userEvent.setup()
    const { container } = render(<ResumeUpload userId={1} currentUrl={null} />)
    fireEvent.change(getFileInput(container), { target: { files: [pdfFile()] } })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Upload resume' })).toBeInTheDocument()
  })

  it('shows an upload-failed message when the mutation errors', () => {
    mockUseUploadResume.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false, isError: true })
    render(<ResumeUpload userId={1} currentUrl={null} />)
    expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
  })
})
