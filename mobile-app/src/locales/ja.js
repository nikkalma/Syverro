export default {
  app: { title: 'シーベロ' },
  buttons: { addBook: '+ 本を追加', save: '保存', cancel: 'キャンセル' },
  theme: { title: 'テーマ', light: 'ライト', dark: 'ダーク', system: 'システム' },
  language: { title: '言語' },
  import: { button: '📥 インポート', alertTitle: 'インポート', alertLoading: '読み込み中...', alertSuccess: '完了', alertError: 'エラー' },
  books: { count: '冊' },
  screens: { details: '本の詳細', back: '戻る' },
  menu: {
    profile: 'マイプロフィール',
    stats: '統計',
    theme: 'ダーク',
    language: '日本語',
    about: 'このアプリについて',
  },
  placeholders: {
    title: 'タイトル', author: '著者', section: 'セクション (国・世紀)',
    genres: 'ジャンル (カンマ区切り)', pages: 'ページ数',
    startDate: '開始日 (DD.MM.YYYY)', endDate: '終了日 (DD.MM.YYYY)',
    notes: 'メモ / レビュー', search: 'タイトル・著者・ジャンル検索...'
  },
  fields: {
    author: '著者', status: 'ステータス', rating: '評価', section: 'セクション',
    genres: 'ジャンル', pages: 'ページ', startDate: '開始日', endDate: '終了日',
    notes: 'メモ', languages: '読んだ言語', review: 'レビュー',
    authorCountry: '著者の国', series: 'シリーズ', seriesPosition: 'シリーズ番号', originalYear: '原著出版年',
  },
  status: {
    planned: '読む予定', reading: '読んでいる', finished: '読了',
    postponed: '延期', abandoned: '断念', rereading: '再読中',
  },
  errors: { emptyFields: '必須項目を入力してください' },
  filters: { all: 'すべて', finished: '読了', reading: '読んでいる', planned: '読む予定' },
  sort: { button: '並び替え', title: '並び替え基準', byDate: '追加日順', byTitle: 'タイトル順', byAuthor: '著者順', byRating: '評価順' },
  empty: { title: '📭 本がありません', subtitle: '➕ ボタンで追加' },
  counters: { total: '合計', finished: '読了', reading: '読んでいる', planned: '読む予定' },
  actions: { deleteTitle: '本を削除', deleteConfirm: '削除しますか？', delete: '削除', cancel: 'キャンセル' },
  stats: {
    title: '統計', progress: '読書進捗', finished: '読了', total: '合計',
    topGenres: '人気ジャンル TOP3', noGenreData: 'データなし', books: '冊',
    addFirstBook: '最初の本を追加', justStarted: '始めたばかり！',
    goodStart: '素晴らしいスタート！', bookworm: '本の虫ですね！', bookKing: '本の王様！',
  },
  
};