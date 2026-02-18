// Video metadata utilities
// Note: Full video metadata extraction would require mediainfo.js
// For MVP, we'll provide basic video file info

export interface VideoMetadata {
  fileName: string
  fileSize: number
  fileType: string
  duration?: number
  width?: number
  height?: number
}

export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = function() {
      resolve({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      })
      URL.revokeObjectURL(video.src)
    }
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
      URL.revokeObjectURL(video.src)
    }
    
    video.src = URL.createObjectURL(file)
  })
}

// Note: Actual video metadata removal would require ffmpeg.wasm
// For MVP, we indicate this feature is not available
export async function removeVideoMetadata(_file: File): Promise<Blob> {
  throw new Error('Video metadata removal requires ffmpeg.wasm and is not available in this version. This feature is planned for a future update.')
}
