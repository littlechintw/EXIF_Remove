declare module 'piexifjs' {
  export function load(dataUrl: string): any
  export function dump(exifObj: any): string
  export function insert(exifBytes: string, dataUrl: string): string
  export function remove(dataUrl: string): string

  export const ImageIFD: any
  export const ExifIFD: any
  export const GPSIFD: any

  const piexif: {
    load: typeof load
    dump: typeof dump
    insert: typeof insert
    remove: typeof remove
    ImageIFD: typeof ImageIFD
    ExifIFD: typeof ExifIFD
    GPSIFD: typeof GPSIFD
  }

  export default piexif
}
