<template>
  <div class="w-full space-y-4">
    <div v-if="originalSize && processedSize" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <h4 class="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
        Before / After
      </h4>
      <div class="space-y-1 text-sm text-green-700 dark:text-green-300">
        <p><span class="font-medium">Original:</span> {{ formatFileSize(originalSize) }}</p>
        <p><span class="font-medium">Processed:</span> {{ formatFileSize(processedSize) }}</p>
        <p><span class="font-medium">Reduction:</span> {{ reductionPercentage }}%</p>
      </div>
    </div>
    
    <button
      @click="handleDownload"
      :disabled="!blob || isDownloading"
      class="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
    >
      <svg
        v-if="!isDownloading"
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span>{{ isDownloading ? 'Downloading...' : 'Download Processed File' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  blob: Blob | null
  originalSize?: number
  processedSize?: number
  fileName?: string
}>()

const isDownloading = ref(false)

const reductionPercentage = computed(() => {
  if (!props.originalSize || !props.processedSize) return 0
  const reduction = ((props.originalSize - props.processedSize) / props.originalSize) * 100
  return Math.round(reduction * 100) / 100
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleDownload = () => {
  if (!props.blob) return
  
  isDownloading.value = true
  
  try {
    const url = URL.createObjectURL(props.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.fileName || `processed_${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } finally {
    isDownloading.value = false
  }
}
</script>
