import { supabase, IMAGE_BUCKET } from './supabase'
import type { DiaryEntry } from '../types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export class EntryError extends Error {}

/** Fetch every entry belonging to the signed-in user (RLS scopes the query). */
export async function fetchAllEntries(): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('entry_date', { ascending: true })

  if (error) {
    throw new EntryError('Could not load your diary. Please try again.')
  }
  return (data ?? []) as DiaryEntry[]
}

/** All attached photos together must stay within the 5 MB limit. */
export function validateImageFiles(files: File[]): string | null {
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return 'Only image files can be attached.'
    }
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  if (totalBytes > MAX_IMAGE_BYTES) {
    return '5 MB max total'
  }
  return null
}

interface CreateEntryParams {
  userId: string
  entryDate: string // 'YYYY-MM-DD'
  content: string
  rating: number | null // 1-5 stars
  imageFiles: File[]
}

/**
 * Uploads the optional images, then inserts the entry row.
 * If any step fails after uploads succeeded, the orphaned images are
 * removed so storage stays clean.
 */
export async function createEntry(params: CreateEntryParams): Promise<DiaryEntry> {
  const { userId, entryDate, content, rating, imageFiles } = params

  const trimmedContent = content.trim()
  if (!trimmedContent) {
    throw new EntryError('Write something before sealing your entry.')
  }

  const invalid = validateImageFiles(imageFiles)
  if (invalid) throw new EntryError(invalid)

  const uploadedPaths: string[] = []

  async function cleanupUploads() {
    if (uploadedPaths.length > 0) {
      // Best effort cleanup; ignore failures.
      await supabase.storage.from(IMAGE_BUCKET).remove(uploadedPaths)
    }
  }

  for (const [index, file] of imageFiles.entries()) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${entryDate}-${Date.now()}-${index}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      await cleanupUploads()
      throw new EntryError('A photo could not be uploaded. Please try again.')
    }
    uploadedPaths.push(path)
  }

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      entry_date: entryDate,
      content: trimmedContent,
      rating,
      image_paths: uploadedPaths.length > 0 ? uploadedPaths : null,
    })
    .select()
    .single()

  if (error) {
    await cleanupUploads()
    if (error.code === '23505') {
      throw new EntryError('An entry already exists for this day.')
    }
    throw new EntryError('Your entry could not be saved. Please try again.')
  }

  return data as DiaryEntry
}

/** Fetch a private diary image as a blob, for saving to the device. */
export async function downloadImage(imagePath: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .download(imagePath)

  if (error || !data) return null
  return data
}

/** Signed URL for a private diary image, valid for one hour. */
export async function getImageUrl(imagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(imagePath, 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
