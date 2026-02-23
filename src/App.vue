<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUploader from './components/FileUploader.vue'
import MetadataViewer from './components/MetadataViewer.vue'
import QualityControl from './components/QualityControl.vue'
import ImageEditor from './components/ImageEditor.vue'
import DownloadButton from './components/DownloadButton.vue'
import { useImageProcessor } from './composables/useImageProcessor'
import { useVideoProcessor } from './composables/useVideoProcessor'
import { copyExif } from './utils/exif'

const activeTab = ref<'image' | 'video'>('image')
const videoConsent = ref(localStorage.getItem('video-consent') === 'true')
const currentFile = ref<File | null>(null)
const editingImageUrl = ref<string | null>(null)
const showEditor = ref(false)
const fileType = ref<string | null>(null)
const quality = ref(0.9)
const selectedMetadataFields = ref<string[]>([])

const formatFileSize = (size: number) => {
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const imageProcessor = useImageProcessor()
const videoProcessor = useVideoProcessor()

const isImageLoaded = computed(() => {
  if (!currentFile.value) return false
  return currentFile.value.type.startsWith('image/')
})
const isVideoLoaded = computed(() => {
  if (!currentFile.value) return false
  return currentFile.value.type.startsWith('video/')
})

const isImagePage = computed(() => activeTab.value === 'image')
const isVideoPage = computed(() => activeTab.value === 'video')

const metadata = computed(() => {
  if (isImageLoaded.value) {
    return imageProcessor.exifData.value || {}
  } else if (isVideoLoaded.value && videoProcessor.videoMetadata.value) {
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
  if (isImageLoaded.value) return imageProcessor.processedBlob.value
  if (isVideoLoaded.value) return videoProcessor.processedBlob.value
  return null
})

const originalSize = computed(() => {
  if (isImageLoaded.value) return imageProcessor.originalSize.value
  if (isVideoLoaded.value) return videoProcessor.videoFile.value?.size || 0
  return 0
})

const processedSize = computed(() => {
  if (isImageLoaded.value) return imageProcessor.processedSize.value
  if (isVideoLoaded.value) return videoProcessor.processedBlob.value?.size || 0
  return 0
})

const error = computed(() => {
  if (isImagePage.value) return imageProcessor.error.value
  if (isVideoPage.value) return videoProcessor.error.value
  return ''
})

const isProcessing = computed(() => {
  if (isImageLoaded.value) return imageProcessor.isProcessing.value
  if (isVideoLoaded.value) return videoProcessor.isProcessing.value
  return false
})

const processedFileName = computed(() => {
  if (!currentFile.value) return ''
  const name = currentFile.value.name
  const lastDot = name.lastIndexOf('.')
  if (lastDot === -1) return `${name}_noexif`
  return `${name.substring(0, lastDot)}_noexif${name.substring(lastDot)}`
})

const reset = () => {
  imageProcessor.reset()
  videoProcessor.reset()
  currentFile.value = null
  fileType.value = null
  showEditor.value = false
  editingImageUrl.value = null
  selectedMetadataFields.value = []
}

const handleVideoConsent = () => {
  videoConsent.value = true
  localStorage.setItem('video-consent', 'true')
}

const handleTabChange = (tab: 'image' | 'video') => {
  if (isProcessing.value) return
  activeTab.value = tab
  // Reset state when switching tabs
  reset()
}

const handleFileSelected = (file: File) => {
  currentFile.value = file
  fileType.value = file.type
  
  if (isImagePage.value) {
    imageProcessor.loadImage(file)
  } else {
    videoProcessor.loadVideo(file)
  }
}

const startEditing = () => {
  if (currentFile.value) {
    editingImageUrl.value = URL.createObjectURL(currentFile.value)
    showEditor.value = true
  }
}

const handleEditorSave = async (blob: Blob) => {
  if (!currentFile.value) return

  // Preserve metadata from original file before updating
  const preservedBlob = await copyExif(currentFile.value, blob)
  
  // Create a new File from the blob to replace the current one
  const newFile = new File([preservedBlob], currentFile.value.name, { type: 'image/jpeg' })
  currentFile.value = newFile
  showEditor.value = false
  editingImageUrl.value = null
  
  // Reload the image processor with the edited file
  await imageProcessor.loadImage(newFile)
}

const handleEditorCancel = () => {
  showEditor.value = false
  editingImageUrl.value = null
}

const handleQualityChanged = (newQuality: number) => {
  quality.value = newQuality
}

const handleSelectionChanged = (fields: string[]) => {
  selectedMetadataFields.value = fields
}

const handleRemoveAll = async () => {
  if (isImageLoaded.value) {
    await imageProcessor.processImage(quality.value, [])
  } else if (isVideoLoaded.value) {
    await videoProcessor.processVideo()
  }
}

const handleKeepSelected = async () => {
  if (isImageLoaded.value) {
    await imageProcessor.processImage(quality.value, selectedMetadataFields.value)
  } else if (isVideoLoaded.value) {
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

      <!-- Tabs Navigation -->
      <div class="flex justify-center mb-8">
        <div class="inline-flex p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
          <button
            @click="handleTabChange('image')"
            :class="[
              'px-6 py-2 text-sm font-medium rounded-md transition-all',
              isImagePage 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            ]"
          >
            Photos
          </button>
          <button
            @click="handleTabChange('video')"
            :class="[
              'px-6 py-2 text-sm font-medium rounded-md transition-all',
              isVideoPage 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            ]"
          >
            Videos
          </button>
        </div>
      </div>

      <div v-if="isVideoPage && !videoConsent" class="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Enable Video Processing</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Video processing requires loading FFmpeg (approx. 30MB) into your browser. This will only happen once.
        </p>
        <button
          @click="handleVideoConsent"
          class="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          I Understand, Enable Video Mode
        </button>
      </div>

      <template v-else>
        <!-- File Uploader -->
        <div class="mb-6">
          <FileUploader 
            :key="activeTab"
            :accept="isImagePage ? 'image/jpeg,image/png,image/heic' : 'video/mp4,video/quicktime,video/*'"
            :help-text="isImagePage ? 'Supports JPG, PNG, or HEIC' : 'Supports MP4, MOV, or other video formats'"
            @file-selected="handleFileSelected" 
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>

        <!-- File Info Card -->
        <div v-if="currentFile" class="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <svg v-if="isImagePage" class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ currentFile.name }}</p>
                <div class="flex gap-4 mt-1">
                  <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ isImagePage ? 'Photo' : 'Video' }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">&bull;</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(currentFile.size) }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">&bull;</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 uppercase">{{ currentFile.type.split('/')[1] }}</span>
                </div>
              </div>
              <button @click="reset" class="text-gray-400 hover:text-red-500 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Viewers/Actions -->
        <div v-if="currentFile" class="space-y-6">
          <div v-if="isImagePage && imageProcessor.exifData.value" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 italic">Photo Details</h2>
            </div>
          </div>
        </div>

        <!-- Image Preview -->
        <div v-if="isImagePage && imageProcessor.imagePreview.value" class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Preview</h3>
            <button 
              @click="startEditing"
              class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-100 dark:border-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              Edit Photo
            </button>
          </div>
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
        <div v-if="isImagePage" class="mb-6">
          <QualityControl @quality-changed="handleQualityChanged" />
        </div>

        <!-- Action Buttons -->
        <div v-if="currentFile" class="mb-6 flex space-x-4">
          <button
            @click="handleRemoveAll"
            :disabled="isProcessing"
            class="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {{ isProcessing ? 'Processing...' : (processedBlob ? 'Redo: Remove All' : 'Remove All Metadata') }}
          </button>
          <button
            @click="handleKeepSelected"
            :disabled="isProcessing || (isImageLoaded && selectedMetadataFields.length === 0)"
            class="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {{ isProcessing ? 'Processing...' : (processedBlob ? 'Redo: Keep Selected' : 'Keep Selected') }}
          </button>
        </div>

        <!-- Download Button -->
        <div v-if="processedBlob">
          <DownloadButton
            :blob="processedBlob"
            :original-size="originalSize"
            :processed-size="processedSize"
            :file-name="processedFileName"
          />
          <button 
            @click="reset" 
            class="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Process Another File
          </button>
        </div>

        <div v-if="showEditor && editingImageUrl" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ImageEditor
            :image-url="editingImageUrl"
            :quality="quality"
            @save="handleEditorSave"
            @cancel="handleEditorCancel"
          />
        </div>
      </template>

      <!-- Footer -->
      <footer class="mt-12 pb-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; {{ new Date().getFullYear() }} EXIF Remove. All processing remains on your device.</p>
        <div class="mt-4 flex justify-center items-center gap-4">
          <a 
            href="https://github.com/littlechintw/EXIF_Remove" 
            target="_blank" 
            rel="noopener"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
            littlechintw / EXIF_Remove
          </a>
        </div>
      </footer>

      <!-- Full Screen Editor Overlay -->
      <ImageEditor 
        v-if="showEditor && editingImageUrl" 
        :image-url="editingImageUrl"
        @save="handleEditorSave"
        @cancel="handleEditorCancel"
      />
    </div>
  </div>
</template>


<style scoped>
/* Additional component-specific styles if needed */
</style>
