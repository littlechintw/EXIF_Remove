import { ref } from 'vue'
import { extractExif, removeAllExif, removeSelectedExif, type ExifData } from '../utils/exif'

export function useImageProcessor() {
  const imageFile = ref<File | null>(null)
  const imagePreview = ref<string>('')
  const exifData = ref<ExifData>({})
  const isProcessing = ref(false)
  const error = ref<string>('')
  const processedBlob = ref<Blob | null>(null)
  const originalSize = ref<number>(0)
  const processedSize = ref<number>(0)

  const loadImage = async (file: File) => {
    try {
      error.value = ''
      imageFile.value = file
      originalSize.value = file.size
      imagePreview.value = URL.createObjectURL(file)
      
      // Extract EXIF data
      const exif = await extractExif(file)
      exifData.value = exif
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load image'
      console.error(err)
    }
  }

  const processImage = async (quality: number = 0.92, keepFields: string[] = []) => {
    if (!imageFile.value) {
      error.value = 'No image loaded'
      return
    }

    try {
      isProcessing.value = true
      error.value = ''

      let blob: Blob
      if (keepFields.length === 0) {
        // Remove all EXIF
        blob = await removeAllExif(imageFile.value, quality)
      } else {
        // Remove selected EXIF
        blob = await removeSelectedExif(imageFile.value, keepFields, quality)
      }

      processedBlob.value = blob
      processedSize.value = blob.size
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process image'
      console.error(err)
    } finally {
      isProcessing.value = false
    }
  }

  const reset = () => {
    if (imagePreview.value) {
      URL.revokeObjectURL(imagePreview.value)
    }
    imageFile.value = null
    imagePreview.value = ''
    exifData.value = {}
    processedBlob.value = null
    error.value = ''
    originalSize.value = 0
    processedSize.value = 0
  }

  return {
    imageFile,
    imagePreview,
    exifData,
    isProcessing,
    error,
    processedBlob,
    originalSize,
    processedSize,
    loadImage,
    processImage,
    reset,
  }
}
