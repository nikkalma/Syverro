export default {
  app: { title: 'Evebrary' },
  buttons: { addBook: '+ Dodaj książkę', save: 'Zapisz', cancel: 'Anuluj' },
  theme: { title: 'Motyw', light: 'Jasny', dark: 'Ciemny', system: 'Systemowy' },
  language: { title: 'Język' },
  import: { button: '📥 Importuj', alertTitle: 'Import', alertLoading: 'Ładowanie...', alertSuccess: 'Gotowe', alertError: 'Błąd' },
  books: { count: 'książek' },
  screens: { details: 'Szczegóły książki', back: 'Wstecz' },
  placeholders: {
    title: 'Tytuł', author: 'Autor', section: 'Sekcja (Kraj, wiek)', genres: 'Gatunki (przecinki)',
    pages: 'Liczba stron', startDate: 'Data rozpoczęcia (DD.MM.YYYY)', endDate: 'Data zakończenia (DD.MM.YYYY)',
    notes: 'Notatki / Recenzja', search: 'Szukaj po tytule, autorze, gatunku...'
  },
  fields: { author: 'Autor', status: 'Status', rating: 'Ocena', section: 'Sekcja', genres: 'Gatunki',
    pages: 'Stron', startDate: 'Data rozpoczęcia', endDate: 'Data zakończenia', notes: 'Notatki', languages: 'Język czytania' },
  status: { planned: 'w planach', reading: 'czytam', finished: 'przeczytane', postponed: 'odłożone', abandoned: 'porzucone', rereading: 'czytam ponownie' },
  errors: { emptyFields: 'Wypełnij wymagane pola' },
  filters: { all: 'Wszystkie', finished: 'Przeczytane', reading: 'Czytam', planned: 'W planach' },
  sort: { button: 'Sortuj', title: 'Sortuj według', byTitle: 'Tytułu', byAuthor: 'Autora', byRating: 'Oceny' },
  empty: { title: '📭 Brak książek', subtitle: 'Naciśnij ➕ aby dodać' },
  counters: { total: 'Razem', finished: 'Przeczytane', reading: 'Czytam', planned: 'W planach' },
  actions: { deleteTitle: 'Usuń książkę', deleteConfirm: 'Na pewno usunąć?', delete: 'Usuń', cancel: 'Anuluj' },
  stats: {
    title: 'Statystyki', progress: 'Postęp czytania', finished: 'Przeczytane', total: 'Razem', topGenres: 'Top 3 gatunki',
    noGenreData: 'Brak danych', books: 'książek', addFirstBook: 'Dodaj pierwszą książkę', justStarted: 'Właśnie zacząłeś!',
    goodStart: 'Świetny start!', bookworm: 'Jesteś prawdziwym molem książkowym!', bookKing: 'Królowa / Król książek!'
  },
  sort: {
  button: 'Sortuj',
  title: 'Sortuj według',
  byDate: 'Według daty dodania',
  byTitle: 'Według tytułu',
  byAuthor: 'Według autora',
  byRating: 'Według oceny',
},
};