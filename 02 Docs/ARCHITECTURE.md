# Архитектура SYVERRO

## 📁 Структура папок
syverro/
├── .expo/ # Служебные файлы Expo (не трогать)
├── android/ # Нативные файлы Android (сборка)
├── assets/ # Статические ресурсы (иконки, splash)
├── components/ # Переиспользуемые UI-компоненты
│ ├── charts/ # Компоненты для графиков (отложено)
│ ├── AuthorSelector.js
│ ├── BookCover.js
│ ├── CompactThemeSwitcher.js
│ ├── GenreSelector.js
│ ├── LanguageSelector.js
│ └── StatCard.js
├── constants/
│ └── Colors.js # Светлая и тёмная темы
├── context/
│ └── ThemeContext.js # Провайдер темы
├── locales/ # Интернационализация (10 языков)
│ ├── index.js
│ ├── ru.js, en.js, be.js, ua.js, ko.js, ja.js, it.js, fr.js, de.js, pl.js
├── screens/
│ ├── AchievementsScreen.js # Достижения
│ ├── BookDetailsScreen/ # Детали + редактирование
│ │ ├── index.js
│ │ ├── EditMode.js
│ │ ├── ViewMode.js
│ │ ├── RatingStars.js
│ │ └── StatusPicker.js
│ ├── HomeScreen/ # Главный экран
│ │ ├── index.js
│ │ ├── Header.js
│ │ ├── ActionButtons.js
│ │ ├── SortModal.js
│ │ ├── AddBookForm.js
│ │ ├── SearchInput.js
│ │ ├── StatusFilters.js
│ │ ├── BookCard.js
│ │ └── EmptyState.js
│ ├── ProfileScreen/ # Профиль
│ │ ├── index.js
│ │ ├── ProfileHeader.js
│ │ ├── ProfileStats.js
│ │ ├── ReaderLevel.js
│ │ └── AvatarModal.js
│ ├── StatsScreen/ # Статистика
│ │ ├── index.js
│ │ ├── StatCards.js
│ │ ├── ProgressBar.js
│ │ ├── TopGenres.js
│ │ └── MotivationCard.js
│ ├── AboutScreen.js
│ ├── CustomDrawerContent.js
│ └── FavoriteBooksScreen.js
├── store/
│ ├── index.js # Zustand store (основной)
│ └── achievements.js # Логика ачивок
├── utils/ # Утилиты
├── .gitignore
├── App.js
├── app.json
├── babel.config.js
├── index.js
├── metro.config.js
├── package.json
└── store.js # (устаревший, используется store/index.js)



## 🔧 Ключевые файлы

| Файл | Назначение |
|------|------------|
| `store/index.js` | Zustand + persist. Книги, ачивки, CRUD, импорт. |
| `store/achievements.js` | Список ачивок, функция `checkAchievements()`. |
| `screens/AchievementsScreen.js` | Экран достижений (прогресс, разблокировка). |
| `screens/StatsScreen/index.js` | Статистика (прогресс, жанры, карточки). |
| `screens/BookDetailsScreen/` | Детали + редактирование книги. |
| `screens/HomeScreen/` | Главный экран (список, фильтры, поиск). |
| `ThemeContext.js` | Тёмная/светлая/системная тема. |
| `Colors.js` | Цветовые схемы. |
| `locales/*.js` | Все строки интерфейса. |

## 📦 Технологический стек

| Категория | Библиотеки |
|-----------|-----------|
| Фреймворк | React Native (Expo SDK 54) |
| Навигация | `@react-navigation/native`, `stack`, `drawer` |
| Состояние | Zustand + persist + AsyncStorage |
| UI | `react-native-gesture-handler`, `react-native-reanimated` |
| Экспорт | `expo-file-system`, `expo-sharing` |
| Интернационализация | ручная (объекты с ключами) |

## 🧭 Навигация

App.js
├── Stack.Navigator
│ ├── Main → Drawer.Navigator → HomeScreen
│ ├── Details → BookDetailsScreen
│ ├── About → AboutScreen
│ ├── Stats → StatsScreen
│ ├── Profile → ProfileScreen
│ ├── FavoriteBooks → FavoriteBooksScreen
│ └── Achievements → AchievementsScreen
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

## 🧩 Особенности

- **Ачивки** — 17 достижений с ироничными названиями, прогресс-бары, авто-проверка
- **Темы** — через контекст, сохранение в AsyncStorage

## 🗃️ Важно для разработчика

- **Не редактируй** `.expo/`, `android/`, `assets/` (кроме иконок).
- **Новые компоненты** клади в `components/` или создавай подпапку в `screens/`.
- **Новые языки** добавляй в `locales/` по шаблону существующих.
- **Любые изменения в `store.js`** требуют проверки миграции данных.