import { describe, it, expect } from 'vitest'
import * as exifUtils from './exif'

describe('exifUtils', () => {
  it('should format exif values correctly', () => {
    expect(exifUtils.formatExifValue('test')).toBe('test')
    expect(exifUtils.formatExifValue(null)).toBe('N/A')
    expect(exifUtils.formatExifValue({ a: 1 })).toBe('{"a":1}')
  })

  // We can't easily test FileReader/Canvas in node without 
  // complex mocking or jsdom + additional libraries,
  // but we can test the logic once we separate the pure logic from DOM if possible.
  // For now, E2E tests are stronger for these.
})
