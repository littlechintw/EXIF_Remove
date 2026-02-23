import { describe, it, expect } from 'vitest'
import * as exifUtils from './exif'

describe('exifUtils', () => {
  it('should format exif values correctly', () => {
    expect(exifUtils.formatExifValue('test')).toBe('test')
    expect(exifUtils.formatExifValue(null)).toBe('N/A')
    expect(exifUtils.formatExifValue(undefined)).toBe('N/A')
    expect(exifUtils.formatExifValue({ a: 1 })).toBe('{"a":1}')
    expect(exifUtils.formatExifValue(123)).toBe('123')
  })

  it('should convert piexif data to flat object', () => {
    const mockPiexifData = {
      '0th': {
        '271': 'Apple',
        '272': 'iPhone 13'
      },
      'Exif': {
        '33434': [1, 100],
        'unknown_tag': 'value'
      },
      'GPS': {
        '1': 'N'
      }
    }
    
    const flat = exifUtils.convertPiexifToFlat(mockPiexifData)
    
    expect(flat.Make).toBe('Apple')
    expect(flat.Model).toBe('iPhone 13')
    expect(flat.ExposureTime).toEqual([1, 100])
    expect(flat.GPSLatitudeRef).toBe('N')
    // Check unknown tag handling
    expect(flat.Exif_unknown_tag).toBe('value')
  })

  it('should convert data URL to Blob', () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const dataUrl = `data:image/png;base64,${base64}`
    
    const blob = exifUtils.dataURLtoBlob(dataUrl)
    
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)
  })

  it('should handle invalid data URL in dataURLtoBlob', () => {
    const blob = exifUtils.dataURLtoBlob('invalid-data')
    expect(blob.size).toBe(0)
  })
})
