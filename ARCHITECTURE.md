# Архитектура Evebrary

## 📁 Структура папок
everbrary/
├── .expo/ # Служебные файлы Expo (не трогать)
├── android/ # Нативные файлы Android (сборка)
├── assets/ # Статические ресурсы (иконки, splash)
├── components/ # Переиспользуемые UI-компоненты
│ ├── charts/ # Компоненты для графиков
│ │ ├── DonutChart.js
│ │ ├── ProgressRing.js
│ │ └── TopGenresBar.js
│ ├── AuthorSelector.js
│ ├── BookCover.js
│ ├── CompactThemeSwitcher.js
│ ├── GenreSelector.js
│ ├── LanguageSelector.js
│ └── StatCard.js
├── constants/
│ └── Colors.js # Светлая и тёмная темы
├── context/
│ └── ThemeContext.js # Провайдер темы, переключение, сохранение
├── locales/ # Интернационализация (10 языков)
│ ├── index.js
│ ├── ru.js, en.js, be.js, ua.js, ko.js, ja.js, it.js, fr.js, de.js, pl.js
├── screens/ # Экраны приложения (разбиты на компоненты)
│ ├── BookDetailsScreen/ # Детали книги + редактирование
│ │ ├── index.js # Главный компонент (переключает режимы)
│ │ ├── EditMode.js # Режим редактирования
│ │ ├── ViewMode.js # Режим просмотра
│ │ ├── RatingStars.js # Выбор и отображение звёзд
│ │ └── StatusPicker.js # Выбор статуса (planned/reading/finished...)
│ ├── HomeScreen/ # Главный экран (список книг)
│ │ ├── index.js
│ │ ├── Header.js
│ │ ├── ActionButtons.js
│ │ ├── SortModal.js
│ │ ├── AddBookForm.js
│ │ ├── SearchInput.js
│ │ ├── StatusFilters.js
│ │ ├── BookCard.js
│ │ └── EmptyState.js
│ ├── ProfileScreen/ # Профиль, уровень, аватар
│ │ ├── index.js
│ │ ├── ProfileHeader.js
│ │ ├── ProfileStats.js
│ │ ├── ReaderLevel.js
│ │ └── AvatarModal.js
│ ├── StatsScreen/ # Статистика (графики, прогресс)
│ │ ├── index.js
│ │ ├── StatCards.js
│ │ ├── ProgressBar.js
│ │ ├── TopGenres.js
│ │ └── MotivationCard.js
│ ├── AboutScreen.js # О приложении, шаринг, ссылки
│ ├── CustomDrawerContent.js # Кастомное боковое меню
│ └── FavoriteBooksScreen.js # Список любимых книг
├── utils/ # Утилиты (если есть)
├── .gitignore
├── App.js # Точка входа, навигация
├── app.json # Конфиг Expo
├── babel.config.js
├── index.js # Точка входа React Native
├── metro.config.js
├── package.json
├── store.js # Zustand store (данные, импорт, миграции)
└── eas.json # Конфиг EAS Build (если используется)



## 🔧 Ключевые файлы и их назначение

| Файл | Назначение |
|------|------------|
| `App.js` | Корень приложения. SplashScreen, загрузка языка, миграция данных. Два навигатора: Stack (экраны) и Drawer (меню). |
| `store.js` | Zustand + persist (AsyncStorage). Хранит `books[]`, методы: `addBook`, `updateBook`, `deleteBook`, `toggleFavorite`, `importBooksFromSheets`. |
| `ThemeContext.js` | Контекст темы. Режимы: light / dark / system. Сохраняется в AsyncStorage. |
| `Colors.js` | Две темы: светлая (`#F3E9DD` — кремовая) и тёмная (`#0A1116` — сине-чёрная). |
| `screens/BookDetailsScreen/index.js` | Детальная страница книги. Переключает `ViewMode` и `EditMode`. |
| `screens/HomeScreen/index.js` | Главный список книг. Фильтры, поиск, сортировка. |
| `screens/ProfileScreen/index.js` | Профиль пользователя. Аватар, имя, уровень, статистика. |
| `screens/StatsScreen/index.js` | Статистика. Прогресс, топ жанров, мотивация. |
| `components/charts/*` | Графики для статистики (Victory Native). |
| `locales/*.js` | Все строки интерфейса. Ключи: `app`, `buttons`, `status`, `fields`, `stats`, `sort`. |

## 📦 Технологический стек

| Категория | Библиотеки |
|-----------|------------|
| Фреймворк | React Native (Expo SDK 54) |
| Навигация | `@react-navigation/native`, `stack`, `drawer` |
| Состояние | Zustand + persist + AsyncStorage |
| UI | `react-native-gesture-handler`, `react-native-reanimated` |
| Графики | Victory Native |
| Экспорт | `expo-file-system`, `expo-sharing` |
| Интернационализация | ручной (объекты с ключами) |

## 🧭 Схема навигации

App.js
│
├── Stack.Navigator (headerShown: false)
│ │
│ ├── Main → Drawer.Navigator
│ │ └── Home → HomeScreen/index.js
│ │
│ ├── Details → BookDetailsScreen/index.js (принимает bookId)
│ ├── About → AboutScreen
│ ├── Stats → StatsScreen/index.js
│ ├── Profile → ProfileScreen/index.js
│ └── FavoriteBooks → FavoriteBooksScreen
│
└── (Drawer открывается через dispatch(DrawerActions.openDrawer()))


**Переходы:**
- Из `HomeScreen` по карточке → `Details`
- Из `CustomDrawerContent` → `Profile`, `Stats`, `About`, `FavoriteBooks`
- Кнопка «←» на всех экранах → `navigation.goBack()`

## 🧩 Нестандартные решения

1. **Разбиение экранов на компоненты** — каждый экран (Details, Home, Profile, Stats) разбит на маленькие файлы в своей папке. Это упрощает поддержку.
2. **Кастомное меню** — `CustomDrawerContent.js` вместо стандартного `drawerContent`.
3. **Темы через контекст** — без `useColorScheme()` напрямую, с переключением и сохранением.
4. **Ручной парсинг CSV** — для импорта из Google Sheets (без сторонних библиотек).
5. **Миграция оценок** — в `store.js`: `migrateOldRatings()` конвертирует 10-балльную шкалу в 5-балльную.
6. **Обложки** — только ручной выбор (Google Books API удалён).
7. **Уровни читателя** — вычисляются в `ProfileScreen` на основе `finishedBooks`.

## 📱 Особенности сборки

- Экспо Go не используется (выход за лимиты). Работаем через **dev build** (`expo run:android` / `expo run:ios`).
- Все изменения — через горячую перезагрузку, без `eas build`.

## 🗃️ Важно для разработчика

- **Не редактируй** `.expo/`, `android/`, `assets/` (кроме иконок).
- **Новые компоненты** клади в `components/` или создавай подпапку в `screens/`.
- **Новые языки** добавляй в `locales/` по шаблону существующих.
- **Любые изменения в `store.js`** требуют проверки миграции данных.