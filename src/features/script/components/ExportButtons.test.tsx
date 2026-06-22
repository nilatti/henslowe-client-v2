import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockGenerateCutScript, mockGenerateMarkedScript } = vi.hoisted(() => ({
  mockGenerateCutScript: vi.fn(),
  mockGenerateMarkedScript: vi.fn(),
}))

vi.mock('../utils/exportScript', () => ({
  generateCutScript: mockGenerateCutScript,
  generateMarkedScript: mockGenerateMarkedScript,
}))

import { ExportButtons } from './ExportButtons'
import type { ScriptAct } from '../types/script'

const act: ScriptAct = { id: 1, number: 2, scenes: [] }
const fakeBlob = new Blob(['fake'], { type: 'application/octet-stream' })

beforeEach(() => {
  vi.clearAllMocks()
  mockGenerateCutScript.mockResolvedValue(fakeBlob)
  mockGenerateMarkedScript.mockResolvedValue(fakeBlob)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function setup() {
  render(<ExportButtons act={act} playTitle="The Tempest" />)
}

describe('ExportButtons — rendering', () => {
  it('renders the cut script button', () => {
    setup()
    expect(screen.getByRole('button', { name: /Download Cut Script/i })).toBeInTheDocument()
  })

  it('renders the marked script button', () => {
    setup()
    expect(screen.getByRole('button', { name: /Download Marked Script/i })).toBeInTheDocument()
  })

  it('both buttons are enabled initially', () => {
    setup()
    expect(screen.getByRole('button', { name: /Download Cut Script/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Download Marked Script/i })).not.toBeDisabled()
  })

  it('shows no error message initially', () => {
    setup()
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument()
  })
})

describe('ExportButtons — cut script', () => {
  it('calls generateCutScript with the act and play title on click', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Cut Script/i }))
    await waitFor(() =>
      expect(mockGenerateCutScript).toHaveBeenCalledWith(act, 'The Tempest')
    )
  })

  it('triggers a download by calling URL.createObjectURL with the returned Blob', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Cut Script/i }))
    await waitFor(() =>
      expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob)
    )
  })

  it('disables the button while the download is in progress', async () => {
    let resolve!: (b: Blob) => void
    mockGenerateCutScript.mockImplementation(
      () => new Promise<Blob>(res => { resolve = res })
    )
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Cut Script/i }))
    expect(screen.getByRole('button', { name: /Download Cut Script/i })).toBeDisabled()
    resolve(fakeBlob)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Download Cut Script/i })).not.toBeDisabled()
    )
  })

  it('shows an error message when generation fails', async () => {
    mockGenerateCutScript.mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Cut Script/i }))
    await waitFor(() =>
      expect(screen.getByText(/Failed to generate cut script/i)).toBeInTheDocument()
    )
  })

  it('re-enables the button after the download completes', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Cut Script/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Download Cut Script/i })).not.toBeDisabled()
    )
  })
})

describe('ExportButtons — marked script', () => {
  it('calls generateMarkedScript with the act and play title on click', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Marked Script/i }))
    await waitFor(() =>
      expect(mockGenerateMarkedScript).toHaveBeenCalledWith(act, 'The Tempest')
    )
  })

  it('shows an error message when generation fails', async () => {
    mockGenerateMarkedScript.mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Marked Script/i }))
    await waitFor(() =>
      expect(screen.getByText(/Failed to generate marked script/i)).toBeInTheDocument()
    )
  })

  it('does not disable the cut script button while marked script loads', async () => {
    let resolve!: (b: Blob) => void
    mockGenerateMarkedScript.mockImplementation(
      () => new Promise<Blob>(res => { resolve = res })
    )
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /Download Marked Script/i }))
    expect(screen.getByRole('button', { name: /Download Cut Script/i })).not.toBeDisabled()
    resolve(fakeBlob)
  })
})
