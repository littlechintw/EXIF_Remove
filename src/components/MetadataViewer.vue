<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
        Metadata
        <span v-if="metadataCount > 0" class="text-sm text-gray-500 dark:text-gray-400 ml-2">
          ({{ metadataCount }} fields)
        </span>
      </h3>
      
      <div class="space-x-2" v-if="metadataCount > 0">
        <button
          @click="selectAll"
          class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Select All
        </button>
        <button
          @click="deselectAll"
          class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Deselect All
        </button>
      </div>
    </div>
    
    <div v-if="metadataCount === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
      No metadata found or no file loaded
    </div>
    
    <div v-else class="space-y-2 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div
        v-for="[key, value] in Object.entries(metadata)"
        :key="key"
        class="flex items-start space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      >
        <input
          type="checkbox"
          :id="`field-${key}`"
          v-model="selectedFields[key]"
          class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label :for="`field-${key}`" class="flex-1 text-sm cursor-pointer">
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ key }}:</span>
          <span class="text-gray-600 dark:text-gray-400 ml-2">{{ formatValue(value) }}</span>
        </label>
      </div>
    </div>
    
    <div v-if="metadataCount > 0" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <p class="text-sm text-blue-700 dark:text-blue-300">
        <span class="font-medium">{{ selectedCount }}</span> field(s) selected to keep
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  metadata: Record<string, any>
}>()

const emit = defineEmits<{
  selectionChanged: [selectedFields: string[]]
}>()

const selectedFields = ref<Record<string, boolean>>({})

const metadataCount = computed(() => Object.keys(props.metadata).length)
const selectedCount = computed(() => Object.values(selectedFields.value).filter(Boolean).length)

const selectAll = () => {
  Object.keys(props.metadata).forEach(key => {
    selectedFields.value[key] = true
  })
}

const deselectAll = () => {
  selectedFields.value = {}
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
  }
  const str = String(value)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

watch(selectedFields, () => {
  const selected = Object.entries(selectedFields.value)
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => key)
  emit('selectionChanged', selected)
}, { deep: true })

// Initialize selected fields when metadata changes
watch(() => props.metadata, () => {
  selectedFields.value = {}
}, { immediate: true })
</script>
