export interface Book {
  id: string
  title: string
  author: string
  cover?: string
  totalPages?: number
  genres?: string[]
  status: 'planned' | 'reading' | 'finished' | 'postponed' | 'abandoned'
  rating?: number
  currentPage?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface UserBook {
  id: string
  bookId: string
  status: string
  rating: number | null
  currentPage: number
  startDate: string | null
  endDate: string | null
  notes: string | null
  isFavorite: boolean
}