const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82

/**
 * Shrinks a photo before it ever leaves the device: capped at 1600px on
 * the long edge and re-encoded as WebP. Typical phone photos drop from
 * ~3-4 MB to a few hundred KB with no visible loss at diary sizes.
 *
 * Returns the original file when compression wouldn't help (already
 * smaller, animated GIF, or a format the browser can't decode).
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    )
    if (!blob || blob.size >= file.size) {
      return file
    }

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.webp`, { type: blob.type })
  } catch {
    // Undecodable format (e.g. HEIC on some browsers) — upload as-is.
    return file
  }
}

/**
 * Re-encodes a stored image (usually WebP) as JPEG so downloads open
 * anywhere. Full resolution is kept; transparency flattens to white
 * since JPEG has no alpha channel.
 */
export async function toJpegBlob(blob: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return null
    }
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0)
    bitmap.close()

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
  } catch {
    return null
  }
}
