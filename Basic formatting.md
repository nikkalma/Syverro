## 📝 Основное форматирование (Basic formatting)

Вот самые нужные тебе элементы (взято из официальной документации Obsidian [](https://obsidian.md/help/syntax)[](https://obsidian.md/pt-BR/help/syntax)):

|Эффект|Синтаксис|Пример|
|---|---|---|
|**Bold**|`**text**` или `__text__`|`**bold text**` → **bold text**|
|_Italic_|`*text*` или `_text_`|`*italic text*` → _italic text_|
|_**Bold + Italic**_|`***text***`|`***bold italic***` → _**bold italic**_|
|~~Strikethrough~~|`~~text~~`|`~~striked out~~` → ~~striked out~~|
|==Highlight==|`==text==`|`==highlighted==` → ==highlighted==|
|`Inline code`|`` `code` ``|`` `const x = 1` `` → `const x = 1`|

**Важно:** Highlight (`== ==`) работает только если в настройках включена опция "Highlight" (Settings → Editor → Show highlights) [](https://obsidian.md/help/syntax).

---

## 📋 Заголовки (Headings)

Для создания уровней используй символ `#` от 1 до 6:

markdown

# Heading 1       (самый крупный)
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

**Зачем:** Заголовки создают структуру и автоматически появляются в Outline (боковая панель), по ним можно навигировать [](https://www.xda-developers.com/obsidian-formatting-long-notes-easier-skim/).

---

## 📌 Списки (Lists)

### Ненумерованный (Bullet list)

markdown

- Первый пункт
- Второй пункт
  - Подпункт (с отступом)
  - Ещё подпункт

Подпункт делается нажатием `Tab`. Вернуться на уровень выше — `Shift + Tab`.

### Нумерованный (Ordered list)

markdown

1. Первый пункт
2. Второй пункт
   3. Подпункт
   4. Ещё подпункт

### Чек-лист (Checklist / Task list)

markdown

- [ ] Задача не выполнена
- [x] Задача выполнена

---

## 🔗 Ссылки (Links)

### Внутренние ссылки (между заметками)

markdown

[[Название заметки]]

Это создаст ссылку на другую заметку в твоём хранилище. Если заметки нет — Obsidian создаст её при клике (это и есть Zettelkasten) [](https://github.com/holgerson11/Obsidian-Cheat-Sheet).

### Внешние ссылки (на сайты)

markdown

[текст ссылки](URL)

Пример: `[Google](https://google.com)` → [Google](https://google.com/)

---

## 🧩 Встраивание заметок (Embed)

Чтобы вставить содержимое другой заметки прямо в текущую:

markdown

![[Название заметки]]

---

## 📊 Таблицы (Tables)

Создаются с помощью вертикальных линий и дефисов [](https://obsidian.md/help/advanced-syntax#Tables):

markdown

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| A        | B        | C        |
| 1        | 2        | 3        |

Выравнивание задаётся двоеточиями:

markdown

| Left | Center | Right |
|:-----|:------:|------:|
| text | text   | text  |

**Живой редактор:** в таблице можно нажать правой кнопкой → Table → добавить/удалить строку или столбец [](https://huggingface.co/spaces/anpigon/obsidian-qa-bot/blob/f46dfb5605d74c9f6b16a448662bec86f828ddfb/docs/obsidian-help/Editing%20and%20formatting/Advanced%20formatting%20syntax.md)[](https://obsidian.md/help/advanced-syntax#Tables).

---

## 💬 Цитаты (Blockquotes)

markdown

> Это цитата.
> Можно на несколько строк.
>>
>> Вложенная цитата (два знака >).

---

## 🧱 Блоки кода (Code blocks)

С подсветкой синтаксиса:

markdown

```javascript
const greeting = "Hello, Obsidian!";
console.log(greeting);
```

Язык указывается после трёх обратных кавычек: `javascript`, `python`, `css` и т.д.

---

## 🎨 Callout (акцентные блоки)

Выделяют важную информацию цветом:

markdown

> [!note]  
> Это заметка. Информация к сведению.
> [!tip]  
> Полезный совет.
> [!warning]  
> Будьте осторожны.
> [!bug]  
> Описание бага.
> [!success]  
> Готово! Успех.

Заголовок после `]` можно менять: `> [!note] Мой заголовок` [](https://github.com/ieshreya/obsidian-cheat-sheet).

---

## ✂️ Горизонтальная линия (Separator)

markdown

---

---

## ⌨️ Горячие клавиши для форматирования (Editing shortcuts)

Пока ты в режиме **Edit** (не Reading), работают эти шорткаты [](https://github.com/ieshreya/obsidian-cheat-sheet)[](https://github.com/holgerson11/Obsidian-Cheat-Sheet):

|Что делает|Windows|Mac|
|---|---|---|
|**Bold**|`Ctrl + B`|`Cmd + B`|
|_Italic_|`Ctrl + I`|`Cmd + I`|
|Вставить внешнюю ссылку|`Ctrl + K`|`Cmd + K`|
|~~Зачеркнуть~~|(нет по умолчанию, добавить в Hotkeys)|—|
|==Выделить==|(нет по умолчанию)|—|
|Создать список|`-` + `Tab` или `1.` + `Tab`|аналогично|

---

## 🧠 Главный совет

Obsidian подсказывает синтаксис по мере ввода. Начни с простого: заголовки (`#`), чек-листы (`- [ ]`), встраивание заметок (`![[ ]]`). Остальное добавится по необходимости. Чем больше форматируешь, тем быстрее оно становится привычным.