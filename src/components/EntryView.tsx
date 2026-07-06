import { useEffect, useState } from 'react'
import { getImageUrl } from '../lib/entries'
import { formatFullDate, formatSealedAt } from '../lib/dates'
import { sanitizeEntryHtml, looksLikeHtml } from '../lib/richtext'
import { ImageLightbox } from './ImageLightbox'
import type { DiaryEntry } from '../types'

interface EntryViewProps {
  entry: DiaryEntry
}

export function EntryView({ entry }: EntryViewProps) {
  const [imageUrls, setImageUrls] = useState<Array<string | null> | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    setImageUrls(null)
    setLightboxIndex(null)
    const paths = entry.image_paths
    if (!paths || paths.length === 0) return

    let cancelled = false
    Promise.all(paths.map((path) => getImageUrl(path))).then((urls) => {
      if (!cancelled) setImageUrls(urls)
    })
    return () => {
      cancelled = true
    }
  }, [entry.id, entry.image_paths])

  const paths = entry.image_paths ?? []

  return (
    <article className="entry-view">
      <header className="panel-header">
        <h2 className="panel-date">{formatFullDate(entry.entry_date)}</h2>
      </header>

      {looksLikeHtml(entry.content) ? (
        <div
          className="entry-view-content"
          // Sanitized to the editor's formatting subset before rendering.
          dangerouslySetInnerHTML={{ __html: sanitizeEntryHtml(entry.content) }}
        />
      ) : (
        <div className="entry-view-content">{entry.content}</div>
      )}

      {entry.rating !== null && (
        <p
          className="entry-view-rating"
          aria-label={`Rated ${entry.rating} out of 5 stars`}
        >
          {'★'.repeat(entry.rating)}
          <span className="rating-empty">{'☆'.repeat(5 - entry.rating)}</span>
        </p>
      )}

      {paths.length > 0 && (
        <div className="entry-view-images">
          {paths.map((path, index) => (
            <figure key={path} className="entry-view-image">
              {imageUrls === null ? (
                <div className="image-loading" aria-hidden="true" />
              ) : imageUrls[index] ? (
                <button
                  type="button"
                  className="entry-view-image-button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`View photo ${index + 1} full screen`}
                >
                  <img src={imageUrls[index]} alt={`Diary photo ${index + 1}`} />
                </button>
              ) : (
                <p className="image-unavailable">The photo could not be loaded.</p>
              )}
            </figure>
          ))}
        </div>
      )}

      <footer className="entry-view-footer">
        Sealed on {formatSealedAt(entry.created_at)}
      </footer>

      {lightboxIndex !== null && imageUrls?.[lightboxIndex] && (
        <ImageLightbox
          url={imageUrls[lightboxIndex]}
          path={paths[lightboxIndex]}
          filename={`diurn-${entry.entry_date}-${lightboxIndex + 1}`}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  )
}
