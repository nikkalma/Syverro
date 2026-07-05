import { bookRepository } from '../db/bookRepository'
import { getSyncEngine } from '../sync'

const syncEngine = getSyncEngine()

export const bookService = {
  async createBook(book: any) {
    // 1. пишем в SQLite
    await bookRepository.create(book)

    // 2. кидаем в sync queue
    await syncEngine.onLocalChange({
      entity: 'Book',
      entity_id: book.id,
      operation: 'create',
      payload: book,
    })
  },

  async updateBook(id: string, updates: any) {
    // 1. SQLite update
    await bookRepository.update(id, updates)

    // 2. sync event
    await syncEngine.onLocalChange({
      entity: 'Book',
      entity_id: id,
      operation: 'update',
      payload: updates,
    })
  },
}