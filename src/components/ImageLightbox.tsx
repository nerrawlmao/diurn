import { useEffect, useState } from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { downloadImage } from '../lib/entries'
import { toJpegBlob } from '../lib/images'

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
}

interface ImageLightboxProps {
  url: string
  path: string
  /** Download name without extension; the extension follows the format. */
  filename: string
  onClose: () => void
}

export function ImageLightbox({ url, path, filename, onClose }: ImageLightboxProps) {
  useLockBodyScroll()

  const [downloading, setDownloading] = useState(false)
  const [downloadFailed, setDownloadFailed] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleDownload() {
    setDownloading(true)
    setDownloadFailed(false)
    let blob = await downloadImage(path)
    if (!blob) {
      setDownloading(false)
      setDownloadFailed(true)
      return
    }

    // JPG/PNG/GIF download as stored; anything else (WebP) is converted
    // to JPEG so the file opens anywhere.
    if (!(blob.type in EXTENSION_BY_TYPE)) {
      const converted = await toJpegBlob(blob)
      if (converted) blob = converted
    }
    setDownloading(false)

    const extension = EXTENSION_BY_TYPE[blob.type] ?? path.split('.').pop() ?? 'jpg'
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${filename}.${extension}`
    link.click()
    URL.revokeObjectURL(objectUrl)
  }

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <img src={url} alt="Diary photo" onClick={(e) => e.stopPropagation()} />
      <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
        {downloadFailed && (
          <span className="lightbox-error" role="alert">
            Download failed
          </span>
        )}
        <button
          type="button"
          className="lightbox-button"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading…' : 'Download'}
        </button>
        <button
          type="button"
          className="lightbox-button"
          onClick={onClose}
          aria-label="Close photo viewer"
        >
          &#215;
        </button>
      </div>
    </div>
  )
}
