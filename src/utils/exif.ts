import piexif from 'piexifjs'

export interface ExifData {
  [key: string]: any
}

// Tag name mappings for common EXIF tags
const TAG_NAMES: Record<number, string> = {
  // Image IFD tags
  271: 'Make',
  272: 'Model',
  274: 'Orientation',
  282: 'XResolution',
  283: 'YResolution',
  296: 'ResolutionUnit',
  305: 'Software',
  306: 'DateTime',
  
  // Exif IFD tags
  33434: 'ExposureTime',
  33437: 'FNumber',
  34850: 'ExposureProgram',
  34855: 'ISOSpeedRatings',
  36864: 'ExifVersion',
  36867: 'DateTimeOriginal',
  36868: 'DateTimeDigitized',
  37121: 'ComponentsConfiguration',
  37377: 'ShutterSpeedValue',
  37378: 'ApertureValue',
  37380: 'ExposureBiasValue',
  37381: 'MaxApertureValue',
  37383: 'MeteringMode',
  37385: 'Flash',
  37386: 'FocalLength',
  37510: 'UserComment',
  40960: 'FlashpixVersion',
  40961: 'ColorSpace',
  40962: 'PixelXDimension',
  40963: 'PixelYDimension',
  41495: 'SensingMethod',
  41728: 'FileSource',
  41729: 'SceneType',
  
  // GPS IFD tags
  0: 'GPSVersionID',
  1: 'GPSLatitudeRef',
  2: 'GPSLatitude',
  3: 'GPSLongitudeRef',
  4: 'GPSLongitude',
  5: 'GPSAltitudeRef',
  6: 'GPSAltitude',
  7: 'GPSTimeStamp',
  29: 'GPSDateStamp',
}

function convertPiexifToFlat(piexifData: any): ExifData {
  const result: ExifData = {}
  
  // Process all IFD sections
  const sections = ['0th', 'Exif', 'GPS', 'Interop', '1st']
  
  for (const section of sections) {
    if (piexifData[section]) {
      for (const [tagId, value] of Object.entries(piexifData[section])) {
        const tagName = TAG_NAMES[Number(tagId)] || `${section}_${tagId}`
        result[tagName] = value
      }
    }
  }
  
  return result
}

export async function extractExif(file: File): Promise<ExifData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = function(e) {
      try {
        const dataUrl = e.target?.result as string
        
        // piexif.load expects JPEG data
        const isJpeg = /^data:image\/jpe?g/i.test(dataUrl)
        if (!isJpeg) {
          // For non-JPEG images, return empty metadata (piexifjs only supports JPEG)
          resolve({})
          return
        }
        
        const piexifData = piexif.load(dataUrl)
        const flatData = convertPiexifToFlat(piexifData)
        resolve(flatData)
      } catch (error) {
        // If no EXIF data found or error reading, return empty object
        console.warn('Metadata extraction note:', error)
        resolve({})
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function removeAllExif(file: File, quality: number = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = function(e) {
      const img = new Image()
      img.src = e.target?.result as string
      
      img.onload = function() {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function removeSelectedExif(
  file: File,
  keepFields: string[],
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async function(e) {
      try {
        const dataUrl = e.target?.result as string
        
        if (!dataUrl.startsWith('data:image/jpeg') && !dataUrl.startsWith('data:image/jpg')) {
          // For non-JPEG, just remove all EXIF via canvas
          return removeAllExif(file, quality).then(resolve).catch(reject)
        }
        
        const originalPiexifData = piexif.load(dataUrl)
        const newPiexifData: any = {
          '0th': {},
          'Exif': {},
          'GPS': {},
          'Interop': {},
          '1st': {},
          'thumbnail': originalPiexifData['thumbnail']
        }
        
        const sections = ['0th', 'Exif', 'GPS', 'Interop', '1st']
        
        for (const section of sections) {
          if (originalPiexifData[section]) {
            for (const [tagId, value] of Object.entries(originalPiexifData[section])) {
              const tagName = TAG_NAMES[Number(tagId)] || `${section}_${tagId}`
              if (keepFields.includes(tagName)) {
                newPiexifData[section][tagId] = value
              }
            }
          }
        }
        
        const exifBytes = piexif.dump(newPiexifData)
        const newDataUrl = piexif.insert(exifBytes, dataUrl)
        
        // Convert to blob
        const res = await fetch(newDataUrl)
        const blob = await res.blob()
        resolve(blob)
      } catch (error) {
        console.error('Error in selective removal:', error)
        // Fallback to remove all if error
        removeAllExif(file, quality).then(resolve).catch(reject)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function formatExifValue(value: any): string {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function dataURLtoBlob(dataurl: string): Blob {
  const [header, data] = dataurl.split(',')
  if (!header || !data) return new Blob([])
  
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  
  const bstr = atob(data)
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export async function copyExif(sourceFile: File, targetBlob: Blob): Promise<Blob> {
  const isJpeg = (type: string) => /image\/jpe?g/i.test(type)
  
  if (!isJpeg(sourceFile.type) || !isJpeg(targetBlob.type)) {
    return targetBlob
  }

  return new Promise((resolve) => {
    const sourceReader = new FileReader()
    sourceReader.onload = (e) => {
      try {
        const sourceDataUrl = e.target?.result as string
        const targetReader = new FileReader()
        targetReader.onload = (e2) => {
          try {
            const targetDataUrl = e2.target?.result as string
            
            let exifData;
            try {
              exifData = piexif.load(sourceDataUrl)
            } catch (e) {
              resolve(targetBlob)
              return
            }
            
            if (!exifData || Object.keys(exifData).length === 0) {
              resolve(targetBlob)
              return
            }

            const exifBytes = piexif.dump(exifData)
            if (exifBytes && exifBytes.length > 50) { 
              const newDataUrl = piexif.insert(exifBytes, targetDataUrl)
              resolve(dataURLtoBlob(newDataUrl))
            } else {
              resolve(targetBlob)
            }
          } catch (err) {
            console.warn('Failed to insert EXIF:', err)
            resolve(targetBlob)
          }
        }
        targetReader.readAsDataURL(targetBlob)
      } catch (err) {
        console.warn('Failed to load EXIF:', err)
        resolve(targetBlob)
      }
    }
    sourceReader.readAsDataURL(sourceFile)
  })
}
