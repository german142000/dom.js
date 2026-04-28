# dom.js — минималистичный DOM-билдер с реактивностью

Библиотека для создания интерфейсов на чистом JavaScript. 
Никакого JSX, никаких шаблонов, никаких зависимостей. 
Один файл, fluent-интерфейс, реактивные сигналы.

## УСТАНОВКА

Скачай `dom.js` и подключи:

```html
<script src="dom.js"></script>
```

Всё. Библиотека доступна глобально как `dom`.

## БЫСТРЫЙ СТАРТ

```javascript
const count = dom.signal(0);

const counter = dom.div()
  .children([
    dom.button().text('-').click(() => count(count() - 1)),
    dom.span().text(count),
    dom.button().text('+').click(() => count(count() + 1)),
  ])
  .done();

document.body.appendChild(counter);
```

## СОДЕРЖАНИЕ

1. Создание элементов
2. Методы билдера
3. Сигналы (реактивность)
4. События
5. Стилизация
6. Дочерние элементы
7. Условный рендеринг и циклы
8. Примеры

## 1. СОЗДАНИЕ ЭЛЕМЕНТОВ

```javascript
dom.tag("id")           // создаёт <tag id="id">
dom.tag()               // создаёт <tag> (без id)
dom.customEl("id")      // camelCase → kebab-case: <custom-el id="id">
dom['custom-el']("id")  // явное указание дефиса
```

Поддерживаются ВСЕ HTML-теги и Custom Elements.

```javascript
// Примеры:
dom.div("main")
dom.span()
dom.h1("title")
dom.input()
dom.wcInclude("my-component")      // <wc-include id="my-component">
dom['my-custom-element']("app")    // <my-custom-element id="app">
```

## 2. МЕТОДЫ БИЛДЕРА

Все методы возвращают `this` (кроме `.done()`), поэтому их можно объединять в цепочки (fluent interface).

Методы, отмеченные `*`, поддерживают сигналы: если передать сигнал вместо значения, DOM будет обновляться автоматически при его изменении.

### `.id(id)`
Установить id элемента.

```javascript
// Пример:
.id("main")
```

### `.cls(classes) *`
Добавить класс(ы) через пробел.

```javascript
// Пример:
.cls("btn primary")

// Сигнал:
.cls(isActive)  // true → добавит, false → уберёт

// Производный:
.cls(isActive.map(v => v ? "on" : "off"))
```

### `.atr(key, value) *`
Установить один атрибут.

```javascript
// Пример:
.atr("disabled", true)

// Сигнал:
.atr("disabled", isDisabled)

// data/aria:
.atr("data-id", "123")
.atr("aria-label", "Close")
```

### `.atrs({...})`
Установить несколько атрибутов разом.

```javascript
// Пример:
.atrs({ id: "main", "data-id": "123", tabindex: 0 })
```

### `.text(str) *`
Установить текст (`textContent`, безопасно).

```javascript
// Пример:
.text("Hello")

// Сигнал:
.text(count)

// Производный:
.text(count.map(v => `Счёт: ${v}`))
```

### `.html(str) *`
Установить HTML (`innerHTML`).

> **ВНИМАНИЕ:** XSS при вставке пользовательских данных

```javascript
// Пример:
.html("<b>Bold</b>")
```

### `.css(str) *`
Добавить инлайн-стили.

```javascript
// Пример:
.css("display: flex; gap: 16px;")

// Сигнал:
.css(theme.map(t => t === 'dark' ? "bg: #000;" : "bg: #fff;"))
```

### `.pcss(pseudo, str) *`
Стили для псевдоклассов/псевдоэлементов. Создаёт `<style>` в `<head>` с уникальным классом.

```javascript
// Пример:
.pcss(":hover", "opacity: 0.8;")
.pcss("::before", "content: ''; display: block;")
```

### `.mcss(query, str) *`
Стили внутри медиа-запроса. Создаёт `<style>` с `@media` в `<head>`.

```javascript
// Пример:
.mcss("(max-width: 768px)", "flex-direction: column;")
.mcss("(prefers-color-scheme: dark)", "background: #1a1a1a;")
```

### `.on(event, handler)`
Добавить обработчик события.

```javascript
// Пример:
.on("click", () => alert("clicked"))
.on("keydown", e => { if (e.key === 'Enter') submit(); })
```

### `.child(builder)`
Добавить один дочерний элемент. Принимает билдер или DOM-элемент.

```javascript
// Пример:
.child(dom.span().text("Hello"))
.child(existingDOMElement)
```

### `.children([...])`
Добавить несколько дочерних элементов. Принимает массив билдеров или DOM-элементов.

```javascript
// Пример:
.children([dom.h1().text("Title"), dom.p().text("Text")])
.children([existingElement, dom.div().text("new")])
```

### `.if(condition, cb) *`
Условный рендеринг: показать если истинно.

```javascript
// Пример:
.if(isAdmin, el => el.text('Админ-панель'))

// Сигнал:
.if(isVisible, el => el.text('Видно'))
```

### `.unless(condition, cb) *`
Условный рендеринг: показать если ложно.

```javascript
// Пример:
.unless(isLoading, el => el.text('Загружено'))
```

### `.each(items, cb) *`
Реактивный цикл по массиву.

```javascript
// Пример:
.each(['а','б'], (item, i) => dom.li().text(item))

// Сигнал:
.each(itemsSignal, (item) => dom.li().text(item.name))
```

### `.done()`
Завершить цепочку, получить DOM-элемент.

> **ВАЖНО:** терминальный метод, после него цепочка заканчивается

```javascript
// Пример:
document.body.appendChild(dom.div().text("Hi").done());
```

## 3. СИГНАЛЫ (РЕАКТИВНОСТЬ)

```javascript
dom.signal(initialValue)    // Создать реактивный сигнал
signal()                    // Получить текущее значение
signal(newValue)            // Установить новое значение
signal.value                // Доступ через свойство (get/set)
signal.map(fn)              // Создать производный сигнал
signal.on(fn)               // Подписаться на изменения
                            // Возвращает функцию для отписки
```

Сигнал можно передавать напрямую в методы, отмеченные `*`. Библиотека автоматически подпишется и будет обновлять DOM.

Производные сигналы (`.map`) создают новый сигнал, который автоматически обновляется при изменении родителя.

```javascript
// Пример:
const count = dom.signal(0);
const doubled = count.map(v => v * 2);
const isPositive = count.map(v => v > 0);

count(5);
// doubled() === 10
// isPositive() === true
```

## 4. СОБЫТИЯ

Явный метод:

```javascript
.on("eventname", handler)
```

Шорткаты через camelCase (работают для любого неизвестного свойства):

```javascript
.click(fn)           // → .on('click', fn)
.dblclick(fn)        // → .on('dblclick', fn)
.mouseEnter(fn)      // → .on('mouseenter', fn)
.keyDown(fn)         // → .on('keydown', fn)
.animationEnd(fn)    // → .on('animationend', fn)
.transitionEnd(fn)   // → .on('transitionend', fn)
.customEvent(fn)     // → .on('custom-event', fn)
.myEvent(fn)         // → .on('my-event', fn)
```

**Правила:**

- Стандартные слитные события используют словарь `EVENT_ALIASES` (`keyDown` → `keydown`, `mouseEnter` → `mouseenter`, `animationEnd` → `animationend`)
- Всё остальное: `camelCase` → `kebab-case` (`myEvent` → `my-event`, `customUpdate` → `custom-update`)

## 5. СТИЛИЗАЦИЯ

### `.css("стили")`
Инлайн-стили элемента.

```javascript
.css("display: flex; padding: 16px;")
```

### `.pcss(":псевдо", "стили")`
Стили для псевдоклассов и псевдоэлементов. Создаёт `<style>` в `<head>` с уникальным классом.

```javascript
.pcss(":hover", "opacity: 0.8;")
.pcss("::before", "content: '→'; margin-right: 8px;")
```

### `.mcss("(запрос)", "стили")`
Стили внутри медиа-запроса. Создаёт `<style>` с `@media` в `<head>`.

```javascript
.mcss("(max-width: 768px)", "flex-direction: column;")
.mcss("(prefers-color-scheme: dark)", "background: #1a1a1a;")
```

Все три метода поддерживают сигналы.

## 6. ДОЧЕРНИЕ ЭЛЕМЕНТЫ

`.child()` и `.children()` принимают:

- Билдеры (результат `dom.tag()` без `.done()`)
- DOM-элементы (результат `.done()` или `document.createElement()`)
- Смесь всего вышеперечисленного

> **ВАЖНО:** элементы внутри `.children()` не должны иметь `.done()`. `.done()` вызывается только один раз — на самом верхнем элементе.

## 7. УСЛОВНЫЙ РЕНДЕРИНГ И ЦИКЛЫ

### `.if(condition, callback)`
Показывает содержимое если condition истинно.

```javascript
// Статическое:
dom.div().if(user.isAdmin, el => el.text('Админ-панель'))

// Реактивное (сигнал):
const isVisible = dom.signal(true);
dom.div().if(isVisible, el => el.text('Видно'))

// С производным сигналом:
dom.div().if(isAdmin.map(a => a && isActive()), el => el.text('Активен'))
```

### `.unless(condition, callback)`
Показывает содержимое если condition ложно (противоположность `.if`).

```javascript
dom.div().unless(isLoading, el => el.text('Контент загружен'))
```

### `.each(items, callback)`
Создаёт дочерние элементы для каждого элемента массива. При изменении сигнала-массива DOM перестраивается автоматически.

```javascript
// Статический массив:
dom.ul().each(['а', 'б', 'в'], (item, i) =>
  dom.li().text(`${i + 1}. ${item}`)
)

// Реактивный массив (сигнал):
const items = dom.signal([{name: 'Первый'}, {name: 'Второй'}]);
dom.ul().each(items, (item) =>
  dom.li().text(item.name)
)

// Добавление:
items([...items(), {name: 'Третий'}]);

// Удаление:
items(items().filter(item => item.name !== 'Второй'));
```

## 8. ПРИМЕРЫ

### Простой счётчик

```javascript
const count = dom.signal(0);
const counter = dom.div()
  .children([
    dom.button().text("-").click(() => count(count() - 1)),
    dom.span().text(count),
    dom.button().text("+").click(() => count(count() + 1)),
  ])
  .done();
document.body.appendChild(counter);
```

### Форма с валидацией

```javascript
const email = dom.signal("");
const isValid = email.map(v => v.includes("@"));
const form = dom.div()
  .children([
    dom.input().atrs({ type: "email", placeholder: "Email" })
      .on("input", e => email(e.target.value))
      .css(isValid.map(v => v ? "border-color: green;" : "border-color: red;")),
    dom.button().text("Submit").atr("disabled", isValid.map(v => !v)),
  ])
  .done();
```

### Карточка с ховером и адаптивом

```javascript
const card = dom.div()
  .cls("card")
  .css("padding: 24px; background: #fff; border-radius: 12px;")
  .pcss(":hover", "box-shadow: 0 4px 12px rgba(0,0,0,0.1);")
  .mcss("(max-width: 768px)", "padding: 16px;")
  .child(dom.h2().text("Title"))
  .done();
```

### Условный рендеринг

```javascript
const isLoggedIn = dom.signal(false);
const app = dom.div()
  .if(isLoggedIn, el => el.text('Добро пожаловать!'))
  .unless(isLoggedIn, el => el.text('Войдите в систему'))
  .done();
```

### Реактивный список задач

```javascript
const todos = dom.signal(['Купить хлеб', 'Позвонить маме']);
const list = dom.div()
  .children([
    dom.h2().text('Список задач'),
    dom.ul().each(todos, (todo, i) =>
      dom.li()
        .text(todo)
        .click(() => {
          const updated = [...todos()];
          updated.splice(i, 1);
          todos(updated);
        })
    ),
    dom.button()
      .text('Добавить')
      .click(() => todos([...todos(), `Задача ${todos().length + 1}`])),
  ])
  .done();
```

### Переключатель темы

```javascript
const darkMode = dom.signal(false);
const app = dom.div()
  .css(darkMode.map(d => d ? 'background: #1a1a2e; color: #fff;' : 'background: #fff; color: #333;'))
  .css('min-height: 100vh; padding: 24px; transition: all 0.3s;')
  .children([
    dom.button()
      .text(darkMode.map(d => d ? '☀️ Светлая тема' : '🌙 Тёмная тема'))
      .click(() => darkMode(!darkMode())),
    dom.p().text('Содержимое страницы'),
  ])
  .done();
```

## ПРИНЦИПЫ БИБЛИОТЕКИ

- Один тег = одна функция = одна цепочка
- `.done()` только в конце, перед вставкой в DOM
- Сигналы передаются напрямую, без `() =>`
- Стили в родном CSS-синтаксисе (строками)
- События через `.on()` или шорткаты `.click()`, `.keyDown()` и т.д.
- `.children()` принимает и билдеры, и DOM-элементы
- `.if()` и `.unless()` для условного рендера (поддерживают сигналы)
- `.each()` для реактивных списков (поддерживает сигналы)
- При изменении сигнала всё что от него зависит обновляется само

## ПОЛНЫЙ СПИСОК МЕТОДОВ

### Создание:

```javascript
dom.tag("id")
dom.tag()
dom['tag-name']("id")
```

### Сигналы:

```javascript
dom.signal(value)
signal()
signal(newValue)
signal.value
signal.map(fn)
signal.on(fn)
```

### Билдер (17 методов):

```javascript
.id(id)
.cls(classes)
.atr(key, value)
.atrs({...})
.text(str)
.html(str)
.css(str)
.pcss(pseudo, str)
.mcss(query, str)
.on(event, handler)
.child(builder)
.children([...])
.if(condition, callback)
.unless(condition, callback)
.each(items, callback)
.done()
```

### Шорткаты событий (автоматические, через Proxy):

```javascript
.click(fn)
.dblclick(fn)
.mouseEnter(fn)
.keyDown(fn)
.animationEnd(fn)
.customEvent(fn)
// ... и любые другие через camelCase
```

## ЛИЦЕНЗИЯ

MIT - и это прекрасно
