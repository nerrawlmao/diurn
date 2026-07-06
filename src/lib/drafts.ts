/**
 * Unsealed drafts never touch the server. Text lives in localStorage and
 * photos in IndexedDB (localStorage can't hold files), both keyed per
 * user and day, so an entry in progress survives refreshes and
 * day-switching. Everything is cleared when the entry is sealed.
 */

function draftKey(userId: string, entryDate: string): string {
  return `diurn-draft:${userId}:${entryDate}`
}

// ---------- Text (localStorage) ----------

export function loadDraft(userId: string, entryDate: string): string {
  try {
    return localStorage.getItem(draftKey(userId, entryDate)) ?? ''
  } catch {
    return ''
  }
}

export function saveDraft(userId: string, entryDate: string, content: string) {
  try {
    if (content.trim()) {
      localStorage.setItem(draftKey(userId, entryDate), content)
    } else {
      localStorage.removeItem(draftKey(userId, entryDate))
    }
  } catch {
    // Private browsing or full storage — the draft just won't persist.
  }
}

export function clearDraft(userId: string, entryDate: string) {
  try {
    localStorage.removeItem(draftKey(userId, entryDate))
    localStorage.removeItem(`${draftKey(userId, entryDate)}:rating`)
  } catch {
    // Ignore: worst case a stale draft remains.
  }
  void clearDraftPhotos(userId, entryDate)
}

// ---------- Rating (localStorage) ----------

export function loadDraftRating(userId: string, entryDate: string): number | null {
  try {
    const raw = localStorage.getItem(`${draftKey(userId, entryDate)}:rating`)
    const rating = Number(raw)
    return raw !== null && Number.isInteger(rating) && rating >= 1 && rating <= 5
      ? rating
      : null
  } catch {
    return null
  }
}

export function saveDraftRating(userId: string, entryDate: string, rating: number | null) {
  try {
    const key = `${draftKey(userId, entryDate)}:rating`
    if (rating !== null) {
      localStorage.setItem(key, String(rating))
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // Private browsing or full storage — the rating just won't persist.
  }
}

// ---------- Photos (IndexedDB) ----------

const DB_NAME = 'diurn-drafts'
const PHOTO_STORE = 'draft-photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PHOTO_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadDraftPhotos(
  userId: string,
  entryDate: string,
): Promise<File[]> {
  try {
    const db = await openDb()
    return await new Promise((resolve) => {
      const request = db
        .transaction(PHOTO_STORE, 'readonly')
        .objectStore(PHOTO_STORE)
        .get(draftKey(userId, entryDate))
      request.onsuccess = () => resolve((request.result as File[] | undefined) ?? [])
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function saveDraftPhotos(
  userId: string,
  entryDate: string,
  files: File[],
): Promise<void> {
  try {
    const db = await openDb()
    const store = db.transaction(PHOTO_STORE, 'readwrite').objectStore(PHOTO_STORE)
    const key = draftKey(userId, entryDate)
    if (files.length > 0) {
      store.put(files, key)
    } else {
      store.delete(key)
    }
  } catch {
    // Storage unavailable — the photos just won't survive a refresh.
  }
}

async function clearDraftPhotos(
  userId: string,
  entryDate: string,
): Promise<void> {
  await saveDraftPhotos(userId, entryDate, [])
}
