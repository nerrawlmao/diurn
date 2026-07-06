export interface DiaryEntry {
  id: string
  user_id: string
  entry_date: string // 'YYYY-MM-DD'
  content: string
  rating: number | null // 1-5 stars
  image_paths: string[] | null
  created_at: string
}
