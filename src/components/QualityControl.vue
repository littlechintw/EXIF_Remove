<template>
  <div class="w-full">
    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
      Quality Control
    </h3>
    
    <div class="space-y-4">
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            JPEG Quality
          </label>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ quality }}%
          </span>
        </div>
        
        <input
          type="range"
          min="60"
          max="100"
          step="5"
          v-model.number="quality"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>60% (More compression)</span>
          <span>100% (No compression)</span>
        </div>
      </div>
      
      <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p class="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> Lower quality reduces file size but may affect image quality.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emit = defineEmits<{
  qualityChanged: [quality: number]
}>()

const quality = ref(90)

watch(quality, (newQuality) => {
  emit('qualityChanged', newQuality / 100)
}, { immediate: true })
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  cursor: pointer;
  border-radius: 50%;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #3b82f6;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}
</style>
