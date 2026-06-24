// src/components/AddBookForm.tsx

import { useState } from 'react'
import { useOffline } from '@/lib/offline'

export function AddBookForm() {
  const { trackEvent } = useOffline()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  const handleAddBook = () => {
    if (!title.trim() || !author.trim()) return

    // Генерируем временный ID для локальной книги
    const tempId = `local-${Date.now()}`

    trackEvent('BOOK_ADDED', tempId, {
      title: title.trim(),
      author: author.trim(),
      addedAt: new Date().toISOString(),
      isLocal: true // маркер, что книга пока не на бэкенде
    })

    // Очищаем форму
    setTitle('')
    setAuthor('')
    console.log('📚 Книга добавлена локально:', title)
  }

  return (
    <div className="add-book-form">
      <input
        placeholder="Название книги"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Автор"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <button onClick={handleAddBook}>➕ Добавить книгу</button>
    </div>
  )
}