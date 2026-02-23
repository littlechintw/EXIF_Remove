import { describe, it, expect, vi } from 'vitest'
import { extractVideoMetadata } from './videoMetadata'

describe('videoMetadata', () => {
  it('should extract video metadata', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURLMock = vi.fn(() => 'blob:abc')
    const revokeObjectURLMock = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock
    })

    // Mock HTMLVideoElement
    const mockVideo = {
      _src: '',
      duration: 10,
      videoWidth: 1920,
      videoHeight: 1080,
      get src() { return this._src },
      set src(value: string) {
        this._src = value
        // Simulate metadata loaded
        setTimeout(() => {
          if (this.onloadedmetadata) this.onloadedmetadata(new Event('loadedmetadata'))
        }, 0)
      },
      onloadedmetadata: null as any,
      onerror: null as any,
      preload: ''
    }

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'video') return mockVideo as any
      return document.createElement(tagName)
    })

    const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' })
    const metadata = await extractVideoMetadata(mockFile)

    expect(metadata.fileName).toBe('test.mp4')
    expect(metadata.duration).toBe(10)
    expect(metadata.width).toBe(1920)
    expect(metadata.height).toBe(1080)
    expect(createObjectURLMock).toHaveBeenCalledWith(mockFile)
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:abc')
  })
})
