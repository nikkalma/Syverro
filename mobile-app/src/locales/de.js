export default {
  app: { title: 'Syverro' },
  buttons: { addBook: '+ Buch hinzufügen', save: 'Speichern', cancel: 'Abbrechen' },
  theme: { title: 'Thema', light: 'Hell', dark: 'Dunkel', system: 'System' },
  language: { title: 'Sprache' },
  import: { button: '📥 Importieren', alertTitle: 'Import', alertLoading: 'Lade...', alertSuccess: 'Fertig', alertError: 'Fehler' },
  books: { count: 'Bücher' },
  screens: { details: 'Buchdetails', back: 'Zurück' },
  menu: {
    profile: 'Mein Profil',
    stats: 'Statistiken',
    theme: 'Dunkel',
    language: 'Deutsch',
    about: 'Über diese App',
  },
  placeholders: {
    title: 'Titel', author: 'Autor', section: 'Sektion (Land, Jahrhundert)',
    genres: 'Genres (durch Kommas getrennt)', pages: 'Seitenzahl',
    startDate: 'Startdatum (DD.MM.YYYY)', endDate: 'Enddatum (DD.MM.YYYY)',
    notes: 'Notizen / Rezension', search: 'Suche nach Titel, Autor, Genre...'
  },
  fields: {
    author: 'Autor', status: 'Status', rating: 'Bewertung', section: 'Sektion',
    genres: 'Genres', pages: 'Seiten', startDate: 'Startdatum', endDate: 'Enddatum',
    notes: 'Notizen', languages: 'Lesesprache', review: 'Rezension',
    authorCountry: 'Land des Autors', series: 'Reihe', seriesPosition: 'Bandnummer', originalYear: 'Originaljahr',
  },
  status: {
    planned: 'geplant', reading: 'lese', finished: 'gelesen',
    postponed: 'verschoben', abandoned: 'abgebrochen', rereading: 'erneut lesen',
  },
  errors: { emptyFields: 'Bitte füllen Sie die Pflichtfelder aus' },
  filters: { all: 'Alle', finished: 'Gelesen', reading: 'Lese', planned: 'Geplant' },
  sort: { button: 'Sortieren', title: 'Sortieren nach', byDate: 'Nach Hinzufügungsdatum', byTitle: 'Nach Titel', byAuthor: 'Nach Autor', byRating: 'Nach Bewertung' },
  empty: { title: '📭 Keine Bücher', subtitle: 'Tippe auf ➕ um hinzuzufügen' },
  counters: { total: 'Gesamt', finished: 'Gelesen', reading: 'Lese', planned: 'Geplant' },
  actions: { deleteTitle: 'Buch löschen', deleteConfirm: 'Wirklich löschen?', delete: 'Löschen', cancel: 'Abbrechen' },
  stats: {
    title: 'Statistiken', progress: 'Lese-Fortschritt', finished: 'Gelesen', total: 'Gesamt',
    topGenres: 'Top 3 Genres', noGenreData: 'Keine Daten', books: 'Bücher',
    addFirstBook: 'Füge dein erstes Buch hinzu', justStarted: 'Du hast gerade angefangen!',
    goodStart: 'Guter Start!', bookworm: 'Du bist ein echter Bücherwurm!', bookKing: 'Bücherkönig / -königin!',
  },
  
};