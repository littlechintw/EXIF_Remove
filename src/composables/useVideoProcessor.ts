import { ref } from 'vue'
import { extractVideoMetadata, removeVideoMetadata, type VideoMetadata } from '../utils/videoMetadata'

export function useVideoProcessor() {
  const videoFile = ref<File | null>(null)
  const videoMetadata = ref<VideoMetadata | null>(null)
  const isProcessing = ref(false)
  const error = ref<string>('')
  const processedBlob = ref<Blob | null>(null)

  const loadVideo = async (file: File) => {
    try {
      error.value = ''
      videoFile.value = file
      
      // Extract video metadata
      const metadata = await extractVideoMetadata(file)
      videoMetadata.value = metadata
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load video'
      console.error(err)
    }
  }

  const processVideo = async () => {
    if (!videoFile.value) {
      error.value = 'No video loaded'
      return
    }

    try {
      isProcessing.value = true
      error.value = ''

      const blob = await removeVideoMetadata(videoFile.value)
      processedBlob.value = blob
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process video'
      console.error(err)
    } finally {
      isProcessing.value = false
    }
  }

  const reset = () => {
    videoFile.value = null
    videoMetadata.value = null
    processedBlob.value = null
    error.value = ''
  }

  return {
    videoFile,
    videoMetadata,
    isProcessing,
    error,
    processedBlob,
    loadVideo,
    processVideo,
    reset,
  }
}
