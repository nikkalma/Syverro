import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAchievements } from './achievements';
import { CHALLENGES_LIST, checkChallenges } from './challenges';

const useStore = create(
  persist(
    (set, get) => ({
      books: [],
      achievements: {
        unlocked: [],
        progress: {},
        newlyUnlocked: null,
      },
      challenges: CHALLENGES_LIST.map(ch => ({
        ...ch,
        progress: 0,
        status: 'active',
        completedAt: null,
      })),

      _updateAchievements: () => {
        const { books, achievements } = get();
        const { unlocked, progress, newlyUnlocked } = checkAchievements(
          books,
          achievements.unlocked,
          achievements.progress,
          achievements.newlyUnlocked
        );
        set({ achievements: { unlocked, progress, newlyUnlocked } });
        get()._updateChallenges();
      },

      _updateChallenges: () => {
        const { books, challenges } = get();
        const updatedChallenges = checkChallenges(books, challenges);
        set({ challenges: updatedChallenges });
      },

      setBooks: (books) => {
        set({ books });
        get()._updateAchievements();
      },

      addBook: async (book) => {
        set((state) => ({
          books: [...state.books, {
            ...book,
            cover: book.cover || null,
            createdAt: Date.now(),
            review: book.review || '',
            favorite: false,
            isActive: false,      
            authorCountry: book.authorCountry || '',
            series: book.series || '',
            seriesPosition: book.seriesPosition || null,
            originalYear: book.originalYear || null,
          }]
        }));
        get()._updateAchievements();
      },

      updateBook: (id, updatedBook) => {
        set((state) => ({
          books: state.books.map((b) => b.id === id ? updatedBook : b)
        }));
        get()._updateAchievements();
      },

      deleteBook: (id) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== id)
        }));
        get()._updateAchievements();
      },

      toggleFavorite: (id) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, favorite: !b.favorite } : b
          )
        }));
        get()._updateAchievements();
      },

            setActiveBook: (id) => set((state) => ({
        books: state.books.map(book => ({
          ...book,
          isActive: book.id === id,
        })),
      })),

      importBooksFromSheets: async () => {
        const sheetId = '2PACX-1vSE7IbtXRMUG7GjTLv3ja9SpOeESudQeXcNjm4BRNVT1EBKQNBHYN_NnGthlYWojVPG8zx5b0FXnU0f';
        const url = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv`;

        try {
          console.log('Начинаю импорт...');
          const response = await fetch(url);
          const csvText = await response.text();

          const rows = [];
          let currentRow = [];
          let currentField = '';
          let inQuotes = false;

          for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              currentRow.push(currentField.trim());
              currentField = '';
            } else if (char === '\n' && !inQuotes) {
              currentRow.push(currentField.trim());
              if (currentRow.length > 0) rows.push(currentRow);
              currentRow = [];
              currentField = '';
            } else {
              currentField += char;
            }
          }
          if (currentField || currentRow.length) {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
          }

          if (rows.length < 2) return { success: false, error: 'Нет данных в таблице' };

          const headers = rows[0].map(h => h.toLowerCase().trim());
          const importedBooks = [];

          const statusMap = {
            'прочитано': 'finished',
            'читаю': 'reading',
            'в планах': 'planned',
            'в процессе': 'reading',
            'отложено': 'postponed',
            'брошено': 'abandoned',
            'перечитываю': 'rereading'
          };

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 2) continue;

            const book = {
              id: Date.now() + i + Math.random().toString(),
              cover: null,
              status: 'planned',
              rating: null,
              authorCountry: '',
              series: '',
              seriesPosition: null,
              originalYear: null,
              genres: [],
              languages: [],
              pages: null,
              startDate: '',
              endDate: '',
              notes: '',
              review: '',
              favorite: false,
              section: '',
              title: '',
              author: ''
            };

            headers.forEach((header, idx) => {
              let value = row[idx] || '';
              if (value === '') return;

              switch (header) {
                case 'title':
                  book.title = value;
                  break;
                case 'author':
                  book.author = value;
                  break;
                case 'selection':
                  book.section = value;
                  break;
                case 'genres':
                  book.genres = value.split(',').map(g => g.trim()).filter(Boolean);
                  break;
                case 'languages':
                  book.languages = value.split(',').map(l => l.trim()).filter(Boolean);
                  break;
                case 'status':
                  const lowerStatus = value.toLowerCase().trim();
                  book.status = statusMap[lowerStatus] || 'planned';
                  break;
                case 'authorcountry':
                  book.authorCountry = value;
                  break;
                case 'series':
                  book.series = value;
                  break;
                case 'seriesposition':
                  book.seriesPosition = Number(value) || null;
                  break;
                case 'originalyear':
                  book.originalYear = Number(value) || null;
                  break;
                case 'rating':
                  let ratingNum = Number(value);
                  if (!isNaN(ratingNum) && ratingNum !== '') {
                    ratingNum = Math.round(ratingNum / 2);
                    if (ratingNum < 0) ratingNum = 0;
                    if (ratingNum > 5) ratingNum = 5;
                    book.rating = ratingNum;
                  } else {
                    book.rating = null;
                  }
                  break;
                case 'pages':
                  book.pages = Number(value) || null;
                  break;
                case 'startdate':
                  if (value.includes(' - ')) {
                    const dates = value.split(' - ');
                    book.startDate = dates[0].trim();
                    book.endDate = dates[1].trim();
                  } else {
                    book.startDate = value;
                  }
                  break;
                case 'notes':
                  book.notes = value;
                  break;
              }
            });

            if (book.title && book.author) {
              importedBooks.push(book);
            }
          }

          if (importedBooks.length === 0) {
            return { success: false, error: 'Не найдено книг с заголовками' };
          }

          set({ books: importedBooks });
          get()._updateAchievements();
          return { success: true, count: importedBooks.length };

        } catch (error) {
          console.error('Import error:', error);
          return { success: false, error: error.message };
        }
      },

      migrateOldRatings: () => {
        const books = get().books;
        let hasChanges = false;

        const updatedBooks = books.map(book => {
          if (book.rating && book.rating > 5) {
            hasChanges = true;
            const newRating = Math.round(book.rating / 2);
            return { ...book, rating: newRating === 0 ? 1 : newRating };
          }
          if (book.rating && typeof book.rating !== 'number') {
            hasChanges = true;
            return { ...book, rating: null };
          }
          return book;
        });

        if (hasChanges) {
          set({ books: updatedBooks });
          get()._updateAchievements();
          console.log('✅ Миграция оценок выполнена');
        }
        return hasChanges;
      },
    }),
    {
      name: 'syverro-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._updateAchievements();
        }
      },
    }
  )
);

export default useStore;