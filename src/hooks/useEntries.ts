import { useCallback, useEffect, useState } from 'react'
import { fetchAllEntries } from '../lib/entries'
import type { DiaryEntry } from '../types'

/**
 * Loads the user's entries once and keeps them in a map keyed by
 * 'YYYY-MM-DD'. Entries are immutable, so the only mutation is adding
 * a newly sealed one.
 */
export function useEntries(userId: string) {
  const [entries, setEntries] = useState<ReadonlyMap<string, DiaryEntry>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchAllEntries()
      .then((list) => {
        if (cancelled) return
        setEntries(new Map(list.map((e) => [e.entry_date, e])))
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const addEntry = useCallback((entry: DiaryEntry) => {
    setEntries((prev) => new Map(prev).set(entry.entry_date, entry))
  }, [])

  return { entries, loading, error, addEntry }
}
