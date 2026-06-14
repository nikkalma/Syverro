import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useBookStore } from '../store/bookStore'
import { booksApi } from '../api/books'

export const useSync = () => {
  const token = useAuthStore((state) => state.token)
  const { setBooks } = useBookStore()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sync = async () => {
    if (!token) return
    if (syncing) return

    setSyncing(true)
    setError(null)

    try {
      console.log('🔄 Синхронизация книг...')
      const data = await booksApi.getUserBooks()
      
      if (data) {
        setBooks(data)
      }
      
      console.log('✅ Синхронизация завершена')
      return data
    } catch (err: any) {
      console.error('❌ Ошибка синхронизации:', err)
      setError(err.message || 'Ошибка синхронизации')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (token) {
      sync()
    }
  }, [token])

  return { sync, syncing, error }
}