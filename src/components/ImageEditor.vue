<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps<{
  imageUrl: string;
  quality?: number;
}>();

const emit = defineEmits<{
  (e: 'save', blob: Blob): void;
  (e: 'cancel'): void;
}>();

const imageElement = ref<HTMLImageElement | null>(null);
let cropper: Cropper | null = null;
const isMosaicMode = ref(false);
const isCropMode = ref(false);
const history = ref<string[]>([]);
const internalQuality = 1.0; // Use max quality for internal baking to prevent cumulative loss

onMounted(() => {
  if (imageElement.value) {
    initCropper(props.imageUrl);
  }
});

const initCropper = (url: string) => {
  if (cropper) {
    cropper.destroy();
  }
  if (!imageElement.value) return;
  
  cropper = new Cropper(imageElement.value, {
    viewMode: 1,
    dragMode: 'move',
    autoCrop: false,
    responsive: true,
    background: true,
    checkOrientation: false, // Important: don't let cropper auto-resolve orientation as we handle it
    ready() {
      // Initialize history if empty
      if (history.value.length === 0) {
        history.value.push(url);
      }
    }
  });
};

const addToHistory = () => {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (canvas) {
    const dataUrl = canvas.toDataURL('image/jpeg', internalQuality);
    history.value.push(dataUrl);
  }
};

const undo = () => {
  if (history.value.length > 1) {
    history.value.pop(); // Remove current state
    const previousState = history.value[history.value.length - 1];
    cropper?.replace(previousState);
    
    // Reset modes
    isMosaicMode.value = false;
    isCropMode.value = false;
    cropper?.setDragMode('move');
    cropper?.clear();
  }
};

const rotateLeft = () => {
  if (!cropper) return;
  cropper.rotate(-90);
  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (canvas) {
    const newDataUrl = canvas.toDataURL('image/jpeg', internalQuality);
    history.value.push(newDataUrl);
    cropper.replace(newDataUrl);
  }
};
const rotateRight = () => {
  if (!cropper) return;
  cropper.rotate(90);
  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (canvas) {
    const newDataUrl = canvas.toDataURL('image/jpeg', internalQuality);
    history.value.push(newDataUrl);
    cropper.replace(newDataUrl);
  }
};
const flipHorizontal = () => {
  if (!cropper) return;
  const data = cropper.getData();
  cropper.scaleX(data.scaleX === 1 ? -1 : 1);
  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (canvas) {
    const newDataUrl = canvas.toDataURL('image/jpeg', internalQuality);
    history.value.push(newDataUrl);
    cropper.replace(newDataUrl);
  }
};
const flipVertical = () => {
  if (!cropper) return;
  const data = cropper.getData();
  cropper.scaleY(data.scaleY === 1 ? -1 : 1);
  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (canvas) {
    const newDataUrl = canvas.toDataURL('image/jpeg', internalQuality);
    history.value.push(newDataUrl);
    cropper.replace(newDataUrl);
  }
};

const setCropMode = () => {
  isMosaicMode.value = false;
  isCropMode.value = !isCropMode.value;
  if (isCropMode.value) {
    cropper?.setDragMode('crop');
    // Set a default box if none
    const data = cropper?.getData();
    if (data && (data.width === 0 || data.height === 0)) {
      cropper?.setCropBoxData({ width: 200, height: 200 });
    }
  } else {
    cropper?.setDragMode('move');
    cropper?.clear();
  }
};

const applyCrop = () => {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (canvas) {
    const newDataUrl = canvas.toDataURL('image/jpeg', internalQuality);
    history.value.push(newDataUrl);
    cropper.replace(newDataUrl);
    isCropMode.value = false;
    cropper.setDragMode('move');
  }
};

const setMoveMode = () => {
  isMosaicMode.value = false;
  isCropMode.value = false;
  cropper?.setDragMode('move');
  cropper?.clear();
};

const toggleMosaicMode = () => {
  isCropMode.value = false;
  isMosaicMode.value = !isMosaicMode.value;
  if (isMosaicMode.value) {
    cropper?.setDragMode('crop');
    const data = cropper?.getData();
    if (data && (data.width === 0 || data.height === 0)) {
      cropper?.setCropBoxData({ width: 100, height: 100 });
    }
  } else {
    cropper?.setDragMode('move');
    cropper?.clear();
  }
};

const applyMosaic = () => {
  if (!cropper) return;
  
  // 1. Get the crop selection data (relative to original image)
  const data = cropper.getData(true);
  
  // 2. Get the cropped pixels
  const croppedCanvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  if (!croppedCanvas) return;

  // 3. Pixelate the cropped canvas
  const pixelSize = 20;
  const w = croppedCanvas.width;
  const h = croppedCanvas.height;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  const smallW = Math.max(1, w / pixelSize);
  const smallH = Math.max(1, h / pixelSize);
  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = smallW;
  smallCanvas.height = smallH;
  const smallCtx = smallCanvas.getContext('2d');
  if (smallCtx) {
    smallCtx.imageSmoothingEnabled = false;
    smallCtx.drawImage(croppedCanvas, 0, 0, smallW, smallH);
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, w, h);
  }

  // 4. Get the FULL image WITH current rotations/flips applied
  // To do this reliably, we clear the selection first
  cropper.clear();
  const fullCanvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  
  if (fullCanvas) {
    const fullCtx = fullCanvas.getContext('2d');
    if (fullCtx) {
      // 5. Draw the mosaic on top of the full image
      fullCtx.drawImage(tempCanvas, data.x, data.y, data.width, data.height);
      
      const newDataUrl = fullCanvas.toDataURL('image/jpeg', internalQuality);
      history.value.push(newDataUrl);
      
      // 6. Replace and RESET transforms since they are now baked into the image
      cropper.replace(newDataUrl);
      
      isMosaicMode.value = false;
      cropper.setDragMode('move');
    }
  }
};

const handleSave = () => {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  
  if (canvas) {
    canvas.toBlob((blob) => {
      if (blob) {
        emit('save', blob);
      }
    }, 'image/jpeg', props.quality || 0.9);
  }
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-black">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
      <button @click="emit('cancel')" class="text-gray-400 hover:text-white transition-colors">
        Cancel
      </button>
      <h2 class="text-white font-medium">Edit Image</h2>
      <button @click="handleSave" class="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Apply Edits
      </button>
    </div>

    <!-- Editor Workspace -->
    <div class="flex-1 relative overflow-hidden flex items-center justify-center p-4">
      <div class="max-w-full max-h-full">
        <img ref="imageElement" :src="imageUrl" class="max-w-full block" />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="px-4 py-4 bg-gray-900 border-t border-gray-800">
      <div class="flex flex-wrap justify-center gap-3">
        <!-- History -->
        <div class="flex bg-gray-800 rounded-lg p-1">
          <button @click="undo" :disabled="history.length <= 1" class="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed" title="Undo">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
        </div>

        <!-- Transform -->
        <div class="flex bg-gray-800 rounded-lg p-1">
          <button @click="setMoveMode" class="p-2 text-gray-400 hover:text-white rounded-md" :class="{ 'bg-blue-600 text-white': !isMosaicMode && !isCropMode }" title="Move/Pan">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 15-3 3-3-3M15 9l-3-3-3 3M9 15l-3-3 3-3M15 15l3-3-3-3"/></svg>
          </button>
          <button @click="rotateLeft" class="p-2 text-gray-400 hover:text-white" title="Rotate Left">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>
          </button>
          <button @click="rotateRight" class="p-2 text-gray-400 hover:text-white" title="Rotate Right">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
          </button>
          <button @click="flipHorizontal" class="p-2 text-gray-400 hover:text-white" title="Flip Horizontal">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M2 15l3-3-3-3M22 15l-3-3 3-3"/></svg>
          </button>
          <button @click="flipVertical" class="p-2 text-gray-400 hover:text-white" title="Flip Vertical">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M15 2l-3 3-3-3M15 22l-3-3-3 3"/></svg>
          </button>
        </div>

        <!-- Crop & Mosaic -->
        <div class="flex bg-gray-800 rounded-lg p-1 gap-1">
          <button @click="setCropMode" class="px-3 py-1 flex items-center gap-2 rounded-md transition-colors" :class="isCropMode ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
            <span class="text-sm font-medium">Crop</span>
          </button>
          
          <button v-if="isCropMode" @click="applyCrop" class="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 animate-pulse">
            Apply Crop
          </button>

          <div class="w-px bg-gray-700 my-1"></div>

          <button @click="toggleMosaicMode" class="px-3 py-1 flex items-center gap-2 rounded-md transition-colors" :class="isMosaicMode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span class="text-sm font-medium">Mosaic</span>
          </button>

          <button v-if="isMosaicMode" @click="applyMosaic" class="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 animate-pulse">
            Apply Mosaic
          </button>
        </div>
      </div>
      
      <div class="h-6 mt-2 flex justify-center items-center">
        <p v-if="isMosaicMode" class="text-blue-400 text-xs">
          Select area & Click "Apply Mosaic"
        </p>
        <p v-else-if="isCropMode" class="text-amber-400 text-xs font-medium">
          Select area & Click "Apply Crop"
        </p>
        <p v-else class="text-gray-500 text-xs">
          Ready for Editing
        </p>
      </div>
    </div>
  </div>
</template>

<style>
/* Custom styles for Cropper.js */
.cropper-bg {
  background-image: none !important;
  background-color: #000 !important;
}
.cropper-view-box {
  outline: 2px solid #3b82f6;
  outline-color: rgba(59, 130, 246, 0.75);
}
.cropper-line, .cropper-point {
  background-color: #3b82f6;
}
</style>
