<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from './components/FileUploader.vue'
import MetadataViewer from './components/MetadataViewer.vue'
import QualityControl from './components/QualityControl.vue'
import DownloadButton from './components/DownloadButton.vue'
import { useImageProcessor } from './composables/useImageProcessor'
import { useVideoProcessor } from './composables/useVideoProcessor'

const currentFile = ref<File | null>(null)
const fileType = ref<'image' | 'video' | null>(null)
const quality = ref(0.92)
const selectedMetadataFields = ref<string[]>([])

const imageProcessor = useImageProcessor()
const videoProcessor = useVideoProcessor()

const isImage = computed(() => fileType.value === 'image')
const isVideo = computed(() => fileType.value === 'video')

const metadata = computed(() => {
  if (isImage.value) {
    return imageProcessor.exifData.value
  } else if (isVideo.value && videoProcessor.videoMetadata.value) {
    return {
      'File Name': videoProcessor.videoMetadata.value.fileName,
      'File Size': videoProcessor.videoMetadata.value.fileSize,
      'File Type': videoProcessor.videoMetadata.value.fileType,
      'Duration': videoProcessor.videoMetadata.value.duration ? `${videoProcessor.videoMetadata.value.duration.toFixed(2)}s` : 'N/A',
      'Width': videoProcessor.videoMetadata.value.width || 'N/A',
      'Height': videoProcessor.videoMetadata.value.height || 'N/A',
    }
  }
  return {}
})

const processedBlob = computed(() => {
  if (isImage.value) return imageProcessor.processedBlob.value
  if (isVideo.value) return videoProcessor.processedBlob.value
  return null
})

const originalSize = computed(() => {
  if (isImage.value) return imageProcessor.originalSize.value
  if (isVideo.value) return videoProcessor.videoFile.value?.size || 0
  return 0
})

const processedSize = computed(() => {
  if (isImage.value) return imageProcessor.processedSize.value
  if (isVideo.value) return videoProcessor.processedBlob.value?.size || 0
  return 0
})

const error = computed(() => {
  if (isImage.value) return imageProcessor.error.value
  if (isVideo.value) return videoProcessor.error.value
  return ''
})

const isProcessing = computed(() => {
  if (isImage.value) return imageProcessor.isProcessing.value
  if (isVideo.value) return videoProcessor.isProcessing.value
  return false
})

const handleFileSelected = async (file: File) => {
  // Reset previous state
  imageProcessor.reset()
  videoProcessor.reset()
  currentFile.value = file

  if (file.type.startsWith('image/')) {
    fileType.value = 'image'
    await imageProcessor.loadImage(file)
  } else if (file.type.startsWith('video/')) {
    fileType.value = 'video'
    await videoProcessor.loadVideo(file)
  }
}

const handleQualityChanged = (newQuality: number) => {
  quality.value = newQuality
}

const handleSelectionChanged = (fields: string[]) => {
  selectedMetadataFields.value = fields
}

const handleRemoveAll = async () => {
  if (isImage.value) {
    await imageProcessor.processImage(quality.value, [])
  } else if (isVideo.value) {
    await videoProcessor.processVideo()
  }
}

const handleKeepSelected = async () => {
  if (isImage.value) {
    await imageProcessor.processImage(quality.value, selectedMetadataFields.value)
  } else if (isVideo.value) {
    // Video doesn't support selective metadata removal in MVP
    await videoProcessor.processVideo()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          EXIF Remover
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Remove metadata from your photos and videos - 100% client-side
        </p>
      </div>

      <!-- File Uploader -->
      <div class="mb-6">
        <FileUploader @file-selected="handleFileSelected" />
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      </div>

      <!-- Image Preview -->
      <div v-if="isImage && imageProcessor.imagePreview.value" class="mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Preview</h3>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-center">
          <img
            :src="imageProcessor.imagePreview.value"
            alt="Preview"
            class="max-w-full max-h-96 rounded"
          />
        </div>
      </div>

      <!-- Metadata Viewer -->
      <div v-if="currentFile" class="mb-6">
        <MetadataViewer
          :metadata="metadata"
          @selection-changed="handleSelectionChanged"
        />
      </div>

      <!-- Quality Control (Images only) -->
      <div v-if="isImage" class="mb-6">
        <QualityControl @quality-changed="handleQualityChanged" />
      </div>

      <!-- Video Warning -->
      <div v-if="isVideo" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p class="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> Video metadata removal requires ffmpeg.wasm and is not fully implemented in this MVP version.
        </p>
      </div>

      <!-- Action Buttons -->
      <div v-if="currentFile" class="mb-6 flex space-x-4">
        <button
          @click="handleRemoveAll"
          :disabled="isProcessing"
          class="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {{ isProcessing ? 'Processing...' : 'Remove All Metadata' }}
        </button>
        <button
          @click="handleKeepSelected"
          :disabled="isProcessing || selectedMetadataFields.length === 0"
          class="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {{ isProcessing ? 'Processing...' : 'Keep Selected' }}
        </button>
      </div>

      <!-- Download Button -->
      <div v-if="processedBlob">
        <DownloadButton
          :blob="processedBlob"
          :original-size="originalSize"
          :processed-size="processedSize"
          :file-name="currentFile?.name"
        />
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>All processing happens in your browser. Your files never leave your device.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional component-specific styles if needed */
</style>
