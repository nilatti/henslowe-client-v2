import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadCsv, slugify } from './csvUtils'

// ─── slugify ──────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('handles apostrophes and special characters', () => {
    expect(slugify("A Midsummer Night's Dream")).toBe('a-midsummer-night-s-dream')
  })

  it('collapses runs of non-alphanumeric characters into a single hyphen', () => {
    expect(slugify('foo  --  bar')).toBe('foo-bar')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('handles an already-clean string', () => {
    expect(slugify('hamlet')).toBe('hamlet')
  })
})

// ─── downloadCsv ─────────────────────────────────────────────────────────────

describe('downloadCsv', () => {
  let capturedBlob: Blob | undefined
  let capturedDownloadAttr: string | undefined

  beforeEach(() => {
    capturedBlob = undefined
    capturedDownloadAttr = undefined

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((b: Blob) => {
        capturedBlob = b
        return 'blob:mock-url'
      }),
      revokeObjectURL: vi.fn(),
    })

    // Intercept createElement so the anchor click doesn't navigate
    const realCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args: unknown[]) => {
      const el = realCreate(tag, ...(args as []))
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          get: () => capturedDownloadAttr,
          set: (v: string) => { capturedDownloadAttr = v },
          configurable: true,
        })
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => undefined)
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers a download with the given filename', () => {
    downloadCsv([['a']], 'output.csv')
    expect(capturedDownloadAttr).toBe('output.csv')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('produces correct comma-separated rows', async () => {
    downloadCsv([['Name', 'Score'], ['Alice', '42']], 'test.csv')
    const text = await capturedBlob!.text()
    // strip BOM
    const csv = text.replace(/^﻿/, '')
    expect(csv).toBe('Name,Score\nAlice,42')
  })

  it('wraps cells that contain a comma in double quotes', async () => {
    downloadCsv([['Hamlet, Prince of Denmark']], 'test.csv')
    const text = await capturedBlob!.text()
    expect(text).toContain('"Hamlet, Prince of Denmark"')
  })

  it('escapes embedded double quotes by doubling them', async () => {
    downloadCsv([['"To be"']], 'test.csv')
    const text = await capturedBlob!.text()
    expect(text).toContain('"""To be"""')
  })

  it('wraps cells that contain a newline in double quotes', async () => {
    downloadCsv([['line one\nline two']], 'test.csv')
    const text = await capturedBlob!.text()
    expect(text).toContain('"line one\nline two"')
  })

  it('does not quote plain cells', async () => {
    downloadCsv([['plain']], 'test.csv')
    const text = await capturedBlob!.text()
    expect(text).not.toContain('"plain"')
  })
})
