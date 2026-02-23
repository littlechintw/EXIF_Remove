// Video metadata utilities
// Note: Full video metadata extraction would require mediainfo.js
// For MVP, we'll provide basic video file info

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

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

// FFmpeg singleton instance
let ffmpeg: FFmpeg | null = null

async function getFFmpeg() {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  
  return ffmpeg
}

/**
 * Removes metadata from a video file using ffmpeg.wasm.
 * It works by re-mapping only the video and audio streams without metadata.
 */
export async function removeVideoMetadata(file: File): Promise<Blob> {
  const ffmpegInstance = await getFFmpeg()
  
  const extension = file.name.substring(file.name.lastIndexOf('.')) || '.mp4'
  const inputName = `input${extension}`
  const outputName = `output${extension}`
  
  // Write file to FFmpeg's virtual filesystem
  await ffmpegInstance.writeFile(inputName, await fetchFile(file))
  
  // Execute command to copy streams but exclude all metadata
  // -map_metadata -1 removed global metadata
  await ffmpegInstance.exec([
    '-i', inputName,
    '-map_metadata', '-1',
    '-c', 'copy',
    outputName
  ])
  
  // Read the result
  const data = await ffmpegInstance.readFile(outputName)
  
  // Cleanup
  await ffmpegInstance.deleteFile(inputName)
  await ffmpegInstance.deleteFile(outputName)
  
  // Convert result to Blob
  // We use any cast here because SharedArrayBuffer (used by ffmpeg.wasm)
  // may cause type compatibility issues with standard Blob parts in some TS configurations,
  // but it works at runtime in browsers supporting COOP/COEP.
  return new Blob([data as any], { type: file.type })
}
