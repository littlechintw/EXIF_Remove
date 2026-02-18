<template>
  <div class="w-full">
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      :class="isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/heic,video/mp4"
        class="hidden"
        @change="handleFileChange"
      />
      
      <div class="space-y-4">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <button
            type="button"
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            @click="fileInput?.click()"
          >
            Click to upload
          </button>
          <span class="ml-1">or drag and drop</span>
        </div>
        
        <p class="text-xs text-gray-500 dark:text-gray-400">
          JPEG, PNG, HEIC or MP4 files
        </p>
      </div>
    </div>
    
    <div v-if="fileInfo" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">File Info</h3>
      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p><span class="font-medium">Name:</span> {{ fileInfo.name }}</p>
        <p><span class="font-medium">Size:</span> {{ formatFileSize(fileInfo.size) }}</p>
        <p><span class="font-medium">Type:</span> {{ fileInfo.type }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const fileInfo = ref<{ name: string; size: number; type: string } | null>(null)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  fileInfo.value = {
    name: file.name,
    size: file.size,
    type: file.type,
  }
  emit('fileSelected', file)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
