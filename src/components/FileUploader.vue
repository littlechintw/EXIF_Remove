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
        :accept="accept"
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
          {{ helpText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  accept: string;
  helpText: string;
}>();

const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    // Check if file matches accept pattern
    const acceptedTypes = props.accept.split(',').map(t => t.trim());
    const fileType = file.type;
    
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''));
      }
      return type === fileType;
    });

    if (isAccepted) {
      emit('file-selected', file);
    }
  }
};
</script>
