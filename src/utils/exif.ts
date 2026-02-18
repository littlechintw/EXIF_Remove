import EXIF from 'exif-js'
import piexif from 'piexifjs'

export interface ExifData {
  [key: string]: any
}

export async function extractExif(file: File): Promise<ExifData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = function(e) {
      const img = new Image()
      img.src = e.target?.result as string
      
      img.onload = function() {
        EXIF.getData(img as any, function(this: any) {
          const allMetaData = EXIF.getAllTags(this)
          resolve(allMetaData || {})
        })
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
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
        
        if (!dataUrl.startsWith('data:image/jpeg')) {
          // For non-JPEG, just remove all EXIF via canvas
          return removeAllExif(file, quality).then(resolve).catch(reject)
        }
        
        // Extract existing EXIF
        piexif.load(dataUrl)
        
        // Create new EXIF with only kept fields
        // This is a simplified version - in a real app, you'd need to map field names to IFD tags
        // For now, if no fields are kept, remove all
        if (keepFields.length === 0) {
          const exifBytes = piexif.dump({})
          const newDataUrl = piexif.insert(exifBytes, dataUrl)
          
          // Convert back to blob
          const response = await fetch(newDataUrl)
          const blob = await response.blob()
          resolve(blob)
        } else {
          // For selective keeping, we'd need more complex logic
          // For MVP, fall back to remove all
          removeAllExif(file, quality).then(resolve).catch(reject)
        }
      } catch (error) {
        reject(error)
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
