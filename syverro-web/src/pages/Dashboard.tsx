import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { booksApi } from '../api/books'
import { Book } from '../types/book'

export default function Dashboard() {
  const logout = useAuthStore((state) => state.logout)
  const token = useAuthStore((state) => state.token)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBook, setNewBook] = useState({ title: '', author: '' })

  useEffect(() => {
    if (token) {
      loadBooks()
    }
  }, [token])

  const loadBooks = async () => {
    try {
      setLoading(true)
      const data = await booksApi.getUserBooks()
      console.log('Загружены книги:', data)
      setBooks(data || [])
    } catch (error) {
      console.error('Ошибка загрузки книг:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBook.title || !newBook.author) return

    try {
      await booksApi.addBook(newBook)
      setNewBook({ title: '', author: '' })
      setShowAddForm(false)
      await loadBooks()
    } catch (error) {
      console.error('Ошибка добавления:', error)
      alert('Ошибка добавления книги')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="orb"></div>
        <div className="glass-card">
          <h1>Библиотека</h1>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="orb"></div>
      <div className="glass-card">
        <h1>Библиотека</h1>
        <div className="tagline">ТВОИ КНИГИ</div>
        <div style={{ width: 60, height: 2, background: '#2A4B60', margin: '1.5rem auto' }}></div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ flex: 1, background: '#3A5570' }}
          >
            + Добавить книгу
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddBook} style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Название книги"
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              style={{ marginBottom: '8px' }}
            />
            <input
              type="text"
              placeholder="Автор"
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              style={{ marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit">Сохранить</button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: '#3A5570' }}>
                Отмена
              </button>
            </div>
          </form>
        )}

        {books.length === 0 && (
          <p style={{ marginBottom: '2rem', color: '#97A6BA', textAlign: 'center' }}>
            У вас пока нет книг. Нажмите «Добавить книгу».
          </p>
        )}

        {books.length > 0 && (
          <div style={{ marginBottom: '2rem', textAlign: 'left', maxHeight: '400px', overflowY: 'auto' }}>
            {books.map((book) => (
              <div
                key={book.id}
                style={{
                  background: '#121C24',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  marginBottom: '8px',
                  border: '1px solid #2A4B60',
                }}
              >
                <div style={{ fontWeight: 600 }}>{book.title}</div>
                <div style={{ fontSize: '0.875rem', color: '#5B86A1' }}>{book.author}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={logout} style={{ background: '#3A5570', marginTop: '1rem' }}>
          Выйти
        </button>
      </div>
    </div>
  )
}