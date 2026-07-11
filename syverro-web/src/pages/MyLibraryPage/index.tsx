import {
  useState,
  useMemo,
  useCallback,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useLibrary,
} from '../../hooks/useLibrary';

import type {
  PersonalBookStatus,
} from '../../types/personalBook';

import BookCard from '../../widgets/BookCard';

import {
  getABTestVariant,
} from '../../utils/abTest';


const statusTabs: {
  key: PersonalBookStatus;
  label: string;
}[] = [
  {
    key: 'reading',
    label: 'Читаю',
  },
  {
    key: 'planned',
    label: 'На полке',
  },
  {
    key: 'completed',
    label: 'Завершено',
  },
  {
    key: 'postponed',
    label: 'Отложено',
  },
  {
    key: 'abandoned',
    label: 'Брошено',
  },
];


const emptyStateMessages: Record<
  PersonalBookStatus,
  string
> = {
  reading:
    'Вы ещё не читаете ни одной книги.',

  rereading:
    'Здесь появятся перечитываемые книги.',

  completed:
    'Здесь появятся завершённые книги.',

  planned:
    'Добавьте книги на полку.',

  postponed:
    'Здесь появятся отложенные книги.',

  abandoned:
    'Здесь появятся брошенные книги.',
};


export default function MyLibraryPage() {

  const navigate = useNavigate();


  const {
    books,
    loading,
  } = useLibrary();


  const [
    activeStatus,
    setActiveStatus,
  ] = useState<PersonalBookStatus>(
    'planned'
  );


  const [
    randomBookId,
    setRandomBookId,
  ] = useState<string | null>(
    null
  );


  const personalBooks = useMemo(
    () =>
      books.filter(
        book => book.personal
      ),

    [
      books,
    ]
  );


  const personalRandomLabel =
    getABTestVariant(
      'personal_random_button',
      'Рука тянется к полке...',
      'Глаза ищут книгу...'
    );


  const stats = useMemo(() => {

    const result =
      {} as Record<
        PersonalBookStatus,
        number
      >;


    statusTabs.forEach(
      tab => {
        result[tab.key] = 0;
      }
    );


    personalBooks.forEach(
      book => {

        const status =
          book.personal?.status;


        if (status) {
          result[status] =
            (result[status] ?? 0) + 1;
        }

      }
    );


    return result;

  }, [
    personalBooks,
  ]);


  const filteredBooks = useMemo(

    () =>

      books.filter(
        book =>
          book.personal?.status === activeStatus
      ),

    [
      books,
      activeStatus,
    ]

  );


  const shelfBooks = useMemo(

    () =>

      books.filter(
        book =>
          book.personal?.status === 'planned'
      ),

    [
      books,
    ]

  );


  const handleRandomPick =
    useCallback(() => {

      if (
        shelfBooks.length < 10
      ) {
        return;
      }


      const index =
        Math.floor(
          Math.random() *
          shelfBooks.length
        );


      setRandomBookId(
        shelfBooks[index].id
      );

    }, [
      shelfBooks,
    ]);


  if (loading) {

    return (
      <div>
        Загрузка...
      </div>
    );

  }


  return (

    <div
      style={{
        maxWidth:
          '1200px',

        margin:
          '0 auto',

        padding:
          '32px 24px',
      }}
    >

      <h1>
        Моя библиотека
      </h1>


      <div>

        {
          statusTabs.map(
            tab => (

              <button
                key={tab.key}
                onClick={() =>
                  setActiveStatus(
                    tab.key
                  )
                }
              >

                {tab.label}

                {' '}

                (
                {
                  stats[tab.key] ?? 0
                }
                )

              </button>

            )
          )
        }


        {
          shelfBooks.length >= 10 &&
          (

            <button
              onClick={
                handleRandomPick
              }
            >
              🎲 {personalRandomLabel}
            </button>

          )
        }

      </div>


      {
        randomBookId && (

          <div>
            Случайная книга:
            {' '}
            {randomBookId}
          </div>

        )
      }


      {
        filteredBooks.length === 0

        ?

        (

          <div>
            {
              emptyStateMessages[
                activeStatus
              ]
            }
          </div>

        )

        :

        (

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'repeat(auto-fill,minmax(180px,1fr))',

              gap:
                '20px',
            }}
          >

            {
              filteredBooks.map(
                book => (

                  <BookCard

                    key={
                      book.id
                    }

                    book={
                      book
                    }

                    personalBook={
                      book.personal
                    }

                    onClick={() =>
                      navigate(
                        `/book/${book.id}`
                      )
                    }

                  />

                )
              )
            }

          </div>

        )
      }


    </div>

  );

}