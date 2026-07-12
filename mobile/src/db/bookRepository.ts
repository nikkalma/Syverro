import { db } from './database';

export const bookRepository = {
  // ==========================================
  // CREATE
  // ==========================================
  create: async (book: any) => {
    await db.runAsync(
      `INSERT INTO books (id, title, author, status, rating, current_page, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        book.id,
        book.title,
        book.author,
        book.status,
        book.rating || null,
        book.current_page || 0,
        Date.now(),
      ]
    );
    console.log(`📖 Book created: ${book.title}`);
  },

  // ==========================================
  // UPDATE
  // ==========================================
  update: async (id: string, updates: any) => {
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      title: 'title',
      author: 'author',
      status: 'status',
      rating: 'rating',
      currentPage: 'current_page',
      totalPages: 'total_pages',
      cover: 'cover_url',
      genres: 'genres',
      notes: 'notes',
      favorite: 'favorite',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = ?`);
        values.push(value ?? null);
      }
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    await db.runAsync(
      `UPDATE books SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    console.log(`📖 Book updated: ${id}`);
  },

  // ==========================================
  // DELETE
  // ==========================================
  delete: async (id: string) => {
    await db.runAsync(
      `UPDATE books SET deleted_at = ? WHERE id = ?`,
      [Date.now(), id]
    );
    console.log(`🗑️ Book deleted: ${id}`);
  },

  // ==========================================
  // GET
  // ==========================================
  getById: async (id: string) => {
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM books WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result || null;
  },

  getAll: async () => {
    const result = await db.getAllAsync<any>(
      `SELECT * FROM books WHERE deleted_at IS NULL ORDER BY updated_at DESC`
    );
    return result;
  },

  // ==========================================
  // CLEAR (для тестов)
  // ==========================================
  clear: async () => {
    await db.runAsync('DELETE FROM books');
  },
};