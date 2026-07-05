import { bookRepository } from '../db/bookRepository'
import { getSyncEngine } from '../sync'

export const bookService = {
  async createBook(book: any) {
    await bookRepository.create(book)

    const engine = getSyncEngine()
    await engine.onLocalChange({
      entity: 'Book',
      entity_id: book.id,
      operation: 'create',
      payload: book,
    })
  },

  async updateBook(id: string, updates: any) {
    await bookRepository.update(id, updates)

    const engine = getSyncEngine()
    await engine.onLocalChange({
      entity: 'Book',
      entity_id: id,
      operation: 'update',
      payload: { id, ...updates },
    })
  },

  async deleteBook(id: string) {
    await bookRepository.delete(id)

    const engine = getSyncEngine()
    await engine.onLocalChange({
      entity: 'Book',
      entity_id: id,
      operation: 'delete',
      payload: { id },
    })
  },
}