import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createEntry, validateImageFiles, EntryError } from '../lib/entries'
import { compressImage } from '../lib/images'
import { sanitizeEntryHtml, htmlToText } from '../lib/richtext'
import {
  loadDraft,
  saveDraft,
  clearDraft,
  loadDraftPhotos,
  saveDraftPhotos,
  loadDraftRating,
  saveDraftRating,
} from '../lib/drafts'
import { formatFullDate, todayKey } from '../lib/dates'
import { ConfirmDialog } from './ConfirmDialog'
import { RichTextEditor } from './RichTextEditor'
import type { DiaryEntry } from '../types'

interface EntryFormProps {
  userId: string
  entryDate: string
  onCreated: (entry: DiaryEntry) => void
}

export function EntryForm({ userId, entryDate, onCreated }: EntryFormProps) {
  const [content, setContent] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // When the user switches days, restore that day's draft (if any).
  useEffect(() => {
    setContent(loadDraft(userId, entryDate))
    setRating(loadDraftRating(userId, entryDate))
    setImageFiles([])
    setError(null)
    setConfirming(false)
    setSaving(false)

    let cancelled = false
    loadDraftPhotos(userId, entryDate).then((files) => {
      if (!cancelled) setImageFiles(files)
    })
    return () => {
      cancelled = true
    }
  }, [userId, entryDate])

  // Keep the object URLs in sync with the chosen files, and release them.
  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviews([])
      return
    }
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imageFiles])

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    // Allow re-picking the same file later.
    event.target.value = ''
    if (picked.length === 0) return

    // Shrink before validating so the 5 MB budget applies to what
    // would actually be uploaded.
    const compressed = await Promise.all(picked.map(compressImage))
    const next = [...imageFiles, ...compressed]
    const invalid = validateImageFiles(next)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    setImageFiles(next)
    void saveDraftPhotos(userId, entryDate, next)
  }

  function removeImage(index: number) {
    const next = imageFiles.filter((_, i) => i !== index)
    setImageFiles(next)
    void saveDraftPhotos(userId, entryDate, next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!htmlToText(content).trim()) {
      setError('Write something before sealing your entry.')
      return
    }
    setError(null)
    setConfirming(true)
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      const entry = await createEntry({
        userId,
        entryDate,
        content: sanitizeEntryHtml(content),
        rating,
        imageFiles,
      })
      clearDraft(userId, entryDate)
      onCreated(entry)
    } catch (err) {
      setConfirming(false)
      setSaving(false)
      setError(
        err instanceof EntryError
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    }
  }

  return (
    <div className="entry-form-wrap">
      <header className="panel-header">
        <h2 className="panel-date">{formatFullDate(entryDate)}</h2>
      </header>

      <form className="entry-form" onSubmit={handleSubmit}>
        <RichTextEditor
          key={`${userId}:${entryDate}`}
          initialHtml={loadDraft(userId, entryDate)}
          placeholder={
            entryDate === todayKey()
              ? 'What happened today?'
              : 'What happened on this day?'
          }
          disabled={saving}
          onChange={(html) => {
            setContent(html)
            // Saved per keystroke so the draft survives refreshes and
            // switching to another day. Markup with no actual text
            // (e.g. a lone <br>) counts as an empty draft.
            saveDraft(userId, entryDate, htmlToText(html).trim() ? html : '')
          }}
        />

        <div className="entry-image-row">
          {imagePreviews.length > 0 && (
            <div className="image-preview-list">
              {imagePreviews.map((url, index) => (
                <div key={url} className="image-preview">
                  <img src={url} alt={`Attached preview ${index + 1}`} />
                  <button
                    type="button"
                    className="image-remove-button"
                    onClick={() => removeImage(index)}
                    disabled={saving}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    &#215;
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="attach-label">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={saving}
              className="visually-hidden"
            />
            <span className="attach-button">
              {imageFiles.length > 0 ? '+ Attach another photo' : '+ Attach photos'}
            </span>
          </label>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="entry-form-footer">
          <div
            className="rating-row"
            role="radiogroup"
            aria-label="How was your day?"
          >
            <span className="rating-label">How was your day?</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button${
                  rating !== null && rating >= star ? ' is-filled' : ''
                }`}
                onClick={() => {
                  // Clicking the current rating clears it.
                  const next = rating === star ? null : star
                  setRating(next)
                  saveDraftRating(userId, entryDate, next)
                }}
                disabled={saving}
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
              >
                {rating !== null && rating >= star ? '★' : '☆'}
              </button>
            ))}
          </div>
          <button type="submit" className="button-primary" disabled={saving}>
            Seal this entry
          </button>
        </div>
      </form>

      {confirming && (
        <ConfirmDialog
          title="Seal this entry?"
          message="Once sealed, an entry can never be edited or deleted. Take a moment to read it over — then let this day rest."
          confirmLabel="Seal it"
          cancelLabel="Keep writing"
          busy={saving}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
