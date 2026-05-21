export default {
  app: { title: '이브브러리' },
  buttons: { addBook: '+ 책 추가', save: '저장', cancel: '취소' },
  theme: { title: '테마', light: '라이트', dark: '다크', system: '시스템' },
  language: { title: '언어' },
  import: { button: '📥 가져오기', alertTitle: '가져오기', alertLoading: '책 불러오는 중...', alertSuccess: '완료!', alertError: '오류' },
  books: { count: '권' },
  screens: { details: '책 상세', back: '뒤로' },
  placeholders: {
    title: '제목', author: '저자', section: '섹션 (나라, 세기)', genres: '장르 (쉼표 구분)',
    pages: '페이지 수', startDate: '시작일 (DD.MM.YYYY)', endDate: '종료일 (DD.MM.YYYY)',
    notes: '메모 / 리뷰', search: '제목, 저자, 장르 검색...'
  },
  fields: { author: '저자', status: '상태', rating: '평점', section: '섹션', genres: '장르',
    pages: '페이지', startDate: '시작일', endDate: '종료일', notes: '메모', languages: '읽은 언어' },
  status: { planned: '읽을 예정', reading: '읽는 중', finished: '읽음', postponed: '보류', abandoned: '포기', rereading: '다시 읽는 중' },
  errors: { emptyFields: '필수 항목을 입력해주세요' },
  filters: { all: '전체', finished: '읽음', reading: '읽는 중', planned: '읽을 예정' },
  sort: { button: '정렬', title: '정렬 기준', byTitle: '제목순', byAuthor: '저자순', byRating: '평점순' },
  empty: { title: '📭 책 없음', subtitle: '➕ 버튼으로 추가' },
  counters: { total: '전체', finished: '읽음', reading: '읽는 중', planned: '읽을 예정' },
  actions: { deleteTitle: '책 삭제', deleteConfirm: '삭제하시겠습니까?', delete: '삭제', cancel: '취소' },
  stats: {
    title: '통계', progress: '읽기 진행률', finished: '읽음', total: '전체', topGenres: '인기 장르 TOP 3',
    noGenreData: '데이터 없음', books: '권', addFirstBook: '첫 책을 추가하세요', justStarted: '시작했습니다!',
    goodStart: '훌륭한 시작!', bookworm: '진정한 책벌레!', bookKing: '책의 왕/여왕!'
  },
  sort: {
  button: '정렬',
  title: '정렬 기준',
  byDate: '추가 날짜순',
  byTitle: '제목순',
  byAuthor: '저자순',
  byRating: '평점순',
}
};