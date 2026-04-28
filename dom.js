/**
 * dom — минималистичный DOM-билдер с реактивностью
 *
 * Концепция: один тег = одна функция = одна цепочка
 *
 * Основные возможности:
 * - Создание любых HTML-элементов через прокси (включая Custom Elements)
 * - Установка атрибутов (одиночных и множественных)
 * - Добавление инлайн-стилей
 * - Стилизация псевдоклассов и псевдоэлементов
 * - Медиа-запросы
 * - Обработчики событий (явные и через шорткаты)
 * - Установка текстового и HTML-содержимого
 * - Добавление дочерних элементов (поддержка DOM-элементов и билдеров)
 * - Автоматическое преобразование camelCase → kebab-case
 * - Реактивные сигналы для автообновления DOM
 * - Условный рендеринг (.if / .unless)
 * - Циклы для реактивных списков (.each)
 *
 * Использование:
 *   dom.div("my-id").cls("container").text("Hello").done()
 *   dom.button().text(count).click(() => count(count() + 1)).done()
 */

// ============================================================
// СЛОВАРИ
// ============================================================

/**
 * Словарь стандартных событий, которые пишутся слитно
 * keyDown → keydown, а не key-down
 * mouseEnter → mouseenter, а не mouse-enter
 */
const EVENT_ALIASES = {
    // Keyboard
    keyDown: 'keydown',
    keyUp: 'keyup',
    keyPress: 'keypress',

    // Mouse
    mouseEnter: 'mouseenter',
    mouseLeave: 'mouseleave',
    mouseDown: 'mousedown',
    mouseUp: 'mouseup',
    mouseMove: 'mousemove',
    mouseOver: 'mouseover',
    mouseOut: 'mouseout',

    // Touch
    touchStart: 'touchstart',
    touchEnd: 'touchend',
    touchMove: 'touchmove',
    touchCancel: 'touchcancel',

    // Focus
    focusIn: 'focusin',
    focusOut: 'focusout',

    // Animation / Transition
    animationStart: 'animationstart',
    animationEnd: 'animationend',
    animationIteration: 'animationiteration',
    transitionEnd: 'transitionend',

    // Drag
    dragStart: 'dragstart',
    dragEnd: 'dragend',
    dragEnter: 'dragenter',
    dragLeave: 'dragleave',
    dragOver: 'dragover',

    // Wheel
    wheelStart: 'wheelstart',
    wheelEnd: 'wheelend',

    // Composition
    compositionStart: 'compositionstart',
    compositionEnd: 'compositionend',
    compositionUpdate: 'compositionupdate',

    // Pointer
    pointerDown: 'pointerdown',
    pointerUp: 'pointerup',
    pointerMove: 'pointermove',
    pointerEnter: 'pointerenter',
    pointerLeave: 'pointerleave',
    pointerOver: 'pointerover',
    pointerOut: 'pointerout',
    pointerCancel: 'pointercancel',

    // Context menu
    contextMenu: 'contextmenu',

    // Form
    formData: 'formdata',
    formChange: 'formchange',
    formInput: 'forminput',
};

/**
 * Зарезервированные имена свойств — не преобразуются в события
 */
const RESERVED = new Set([
    'signal',
    'then',
    'valueOf',
    'toString',
    'inspect',
    'if',
    'unless',
    'each',
]);


// ============================================================
// СИГНАЛ — реактивная переменная
// ============================================================

/**
 * Создаёт реактивный сигнал
 *
 * @param {*} initialValue - начальное значение сигнала
 * @returns {Function} - функция-геттер/сеттер с дополнительными методами
 *
 * Использование:
 *   const count = dom.signal(0);
 *   count()          // получить значение
 *   count(42)        // установить значение
 *   count.value      // альтернативный доступ через свойство
 *   count.map(fn)    // создать производный сигнал
 *   count.on(fn)     // подписаться на изменения
 *
 * В билдере (передаётся напрямую, без обёрток):
 *   .text(count)         // текст обновляется при изменении сигнала
 *   .cls(isActive)       // класс обновляется при изменении сигнала
 *   .atr("disabled", s)  // атрибут обновляется при изменении сигнала
 *   .css(s.map(v => ...)) // стили через производный сигнал
 */
function createSignal(initialValue) {
    let value = initialValue;
    const listeners = new Set();

    /**
     * Сигнал-функция: вызов без аргументов — геттер, с аргументом — сеттер
     * @param {*} [newValue] - новое значение (если передано)
     * @returns {*} - текущее значение (в режиме геттера) или новое значение (в режиме сеттера)
     */
    function signal(newValue) {
        if (arguments.length === 0) {
            return value;
        }
        const oldValue = value;
        value = newValue;
        if (oldValue !== newValue) {
            listeners.forEach(fn => fn(value, oldValue));
        }
        return value;
    }

    /**
     * Подписка на изменения сигнала
     * @param {Function} fn - коллбэк, вызывается при изменении: fn(newValue, oldValue)
     * @returns {Function} - функция для отписки
     *
     * Пример:
     *   const unsubscribe = count.on((newVal, oldVal) => {
     *     console.log(`Изменилось: ${oldVal} → ${newVal}`);
     *   });
     *   // позже: unsubscribe();
     */
    signal.on = function(fn) {
        listeners.add(fn);
        fn(value, value); // сразу вызываем с текущим значением
        return () => listeners.delete(fn);
    };

    /**
     * Создаёт производный сигнал на основе текущего
     * @param {Function} fn - функция трансформации: fn(currentValue) → newValue
     * @returns {Function} - новый сигнал, зависящий от родительского
     *
     * Пример:
     *   const doubled = count.map(v => v * 2);
     *   const isValid = email.map(v => v.includes("@"));
     *   const styles = isActive.map(v => v ? "bg: green;" : "bg: red;");
     */
    signal.map = function(fn) {
        const derived = createSignal(fn(value));
        signal.on(newVal => derived(fn(newVal)));
        return derived;
    };

    /**
     * Свойство value для альтернативного доступа к значению
     */
    Object.defineProperty(signal, 'value', {
        get: () => signal(),
        set: (v) => signal(v)
    });

    return signal;
}


// ============================================================
// ПРОКСИ ДЛЯ СОЗДАНИЯ ЭЛЕМЕНТОВ
// ============================================================

/**
 * Прокси для создания элементов по имени тега
 *
 * dom.div("main")         → создаёт <div id="main">
 * dom.span()              → создаёт <span>
 * dom.wcInclude("panel")  → создаёт <wc-include id="panel"> (camelCase → kebab-case)
 * dom['wc-include']("x")  → создаёт <wc-include id="x"> (явное указание дефиса)
 * dom.signal(0)           → создаёт реактивный сигнал (не элемент!)
 */
window.dom = new Proxy({
    signal: createSignal,
}, {
    get(target, prop) {
        if (prop in target) return target[prop];
        const realTag = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return (id) => {
            const el = document.createElement(realTag);
            if (id !== undefined && typeof id === 'string') {
                el.id = id;
            }
            return createBuilder(el);
        };
    }
});


// ============================================================
// БИЛДЕР ЭЛЕМЕНТА
// ============================================================

/**
 * Создаёт билдер для DOM-элемента с fluent-интерфейсом
 *
 * @param {HTMLElement} el - DOM-элемент для оборачивания
 * @returns {Proxy} - билдер с fluent-интерфейсом
 *
 * Билдер оборачивается в Proxy для автоматического создания
 * шорткатов событий: любое неизвестное свойство становится обработчиком события
 */
function createBuilder(el) {
    /**
     * Проверяет, является ли значение сигналом
     * Сигнал — это функция с методом .on
     * @param {*} val - значение для проверки
     * @returns {boolean}
     */
    const isSignal = (val) => typeof val === 'function' && typeof val.on === 'function';

    const builder = {
        /**
         * Ссылка на реальный DOM-элемент
         * Используется методами .child(), .children() и .done()
         */
        element: el,
        _proxy: null,

        /**
         * Устанавливает id элемента
         * @param {string} id - идентификатор элемента
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Пример:
         *   .id("main")
         *   .id("submit-btn")
         */
        id(id) {
            el.id = id;
            return this._proxy;
        },

        /**
         * Добавляет класс(ы) элементу
         * Поддерживает как обычную строку, так и сигнал
         *
         * @param {string|Function} cls - имя класса, классы через пробел, или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .cls("active")                    // обычная строка
         *   .cls("btn primary large")         // несколько классов
         *   .cls(isActive)                    // сигнал: true → класс добавится, false → уберётся
         *   .cls(isActive.map(v => v ? "on" : "off"))  // производный сигнал
         */
        cls(cls) {
            if (isSignal(cls)) {
                cls.on(value => {
                    el.className = '';
                    if (value) {
                        el.classList.add(...String(value).split(' ').filter(Boolean));
                    }
                });
            } else {
                el.classList.add(...cls.split(' ').filter(Boolean));
            }
            return this._proxy;
        },

        /**
         * Устанавливает один атрибут на элемент
         * Поддерживает как обычное значение, так и сигнал
         *
         * @param {string} key - имя атрибута
         *   - 'class' → устанавливает className
         *   - 'data-*' → setAttribute (data-атрибуты)
         *   - 'aria-*' → setAttribute (aria-атрибуты)
         *   - 'style' → устанавливает style.cssText
         *   - всё остальное → прямое присвоение el[key] = value
         * @param {*|Function} value - значение атрибута или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .atr("data-media-id", "123")      // обычное значение
         *   .atr("disabled", true)            // булево
         *   .atr("disabled", isDisabled)      // сигнал
         *   .atr("data-count", count)         // сигнал → значение атрибута автообновляется
         */
        atr(key, value) {
            if (isSignal(value)) {
                value.on(val => {
                    if (val === false || val === null || val === undefined) {
                        el.removeAttribute(key);
                    } else {
                        if (key === 'class') {
                            el.className = val;
                        } else if (key.startsWith('data-') || key.startsWith('aria-')) {
                            el.setAttribute(key, String(val));
                        } else if (key === 'style') {
                            el.style.cssText = String(val);
                        } else {
                            el[key] = val;
                        }
                    }
                });
            } else {
                if (key === 'class') {
                    el.className = value;
                } else if (key.startsWith('data-') || key.startsWith('aria-')) {
                    el.setAttribute(key, value);
                } else if (key === 'style') {
                    el.style.cssText = value;
                } else {
                    el[key] = value;
                }
            }
            return this._proxy;
        },

        /**
         * Устанавливает несколько атрибутов разом
         * @param {Object} attrs - объект вида { ключ: значение, ... }
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Пример:
         *   .atrs({
         *     "data-id": "123",
         *     "aria-label": "Main content",
         *     tabindex: 0
         *   })
         */
        atrs(attrs) {
            Object.entries(attrs).forEach(([k, v]) => this.atr(k, v));
            return this._proxy;
        },

        /**
         * Добавляет инлайн-стили элементу
         * Поддерживает строку и сигнал
         *
         * @param {string|Function} str - CSS-правила в виде строки, или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .css("display: flex; gap: 16px;")  // обычная строка
         *   .css(isActive.map(v => v ? "background: green;" : "background: red;"))  // сигнал
         */
        css(str) {
            if (isSignal(str)) {
                str.on(val => {
                    el.style.cssText = (el.style.cssText || '') + String(val);
                });
            } else {
                el.style.cssText += str;
            }
            return this._proxy;
        },

        /**
         * Добавляет стили для псевдоклассов и псевдоэлементов
         * Создаёт уникальный класс элемента и добавляет <style> в <head>
         * Поддерживает строку и сигнал
         *
         * @param {string} pseudo - псевдоселектор (":hover", ":focus", "::before", "::after" и др.)
         * @param {string|Function} str - CSS-правила в виде строки, или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .pcss(":hover", "opacity: 0.8;")
         *   .pcss("::before", "content: ''; display: block;")
         *   .pcss(":hover", hoverStyle)  // сигнал
         */
        pcss(pseudo, str) {
            const cls = `pcss-${Math.random().toString(36).slice(2, 9)}`;
            el.classList.add(cls);
            const style = document.createElement('style');

            if (isSignal(str)) {
                str.on(val => {
                    style.textContent = `.${cls}${pseudo} { ${val} }`;
                });
            } else {
                style.textContent = `.${cls}${pseudo} { ${str} }`;
            }

            document.head.appendChild(style);
            return this._proxy;
        },

        /**
         * Добавляет стили внутри медиа-запроса
         * Создаёт уникальный класс элемента и добавляет <style> с @media в <head>
         * Поддерживает строку и сигнал
         *
         * @param {string} query - медиа-запрос ("(max-width: 768px)", "(prefers-color-scheme: dark)" и др.)
         * @param {string|Function} str - CSS-правила в виде строки, или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .mcss("(max-width: 768px)", "flex-direction: column;")
         *   .mcss("(prefers-color-scheme: dark)", darkThemeStyles)  // сигнал
         */
        mcss(query, str) {
            const cls = `mcss-${Math.random().toString(36).slice(2, 9)}`;
            el.classList.add(cls);
            const style = document.createElement('style');

            if (isSignal(str)) {
                str.on(val => {
                    style.textContent = `@media ${query} { .${cls} { ${val} } }`;
                });
            } else {
                style.textContent = `@media ${query} { .${cls} { ${str} } }`;
            }

            document.head.appendChild(style);
            return this._proxy;
        },

        /**
         * Добавляет обработчик события на элемент
         * Использует addEventListener под капотом
         *
         * @param {string} event - имя события (любое валидное DOM-событие)
         * @param {Function} handler - функция-обработчик
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .on("click", (e) => console.log("clicked"))
         *   .on("keydown", (e) => { if (e.key === 'Enter') submit(); })
         *   .on("custom-event", handleCustom)
         */
        on(event, handler) {
            el.addEventListener(event, handler);
            return this._proxy;
        },

        /**
         * Устанавливает текстовое содержимое элемента
         * Поддерживает строку и сигнал
         * Использует textContent — безопасно, без интерпретации HTML
         *
         * @param {string|Function} str - текст для вставки, или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .text("Hello World")           // обычная строка
         *   .text(count)                   // сигнал: "0" → "1" → "2" ...
         *   .text(count.map(v => `Счёт: ${v}`))  // производный сигнал
         */
        text(str) {
            if (isSignal(str)) {
                str.on(val => {
                    el.textContent = String(val);
                });
            } else {
                el.textContent = str;
            }
            return this._proxy;
        },

        /**
         * Устанавливает HTML-содержимое элемента
         * Поддерживает строку и сигнал
         * Использует innerHTML — интерпретирует строку как HTML
         *
         * ВНИМАНИЕ: потенциальная XSS-уязвимость при вставке
         * непроверенных пользовательских данных
         *
         * @param {string|Function} str - HTML-строка для вставки, или сигнал
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .html("<b>Bold text</b>")
         *   .html(content)  // сигнал
         */
        html(str) {
            if (isSignal(str)) {
                str.on(val => {
                    el.innerHTML = String(val);
                });
            } else {
                el.innerHTML = str;
            }
            return this._proxy;
        },

        /**
         * Добавляет один дочерний элемент
         * Принимает билдер, DOM-элемент, или прокси-билдер
         *
         * @param {Object|HTMLElement} b - билдер или готовый DOM-элемент
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Пример:
         *   .child(dom.span().text("Hello").cls("greeting"))  // билдер
         *   .child(dom.br())
         *   .child(document.createElement('hr'))              // DOM-элемент
         */
        child(b) {
            if (b instanceof HTMLElement) {
                el.appendChild(b);
            } else if (b && b.element instanceof HTMLElement) {
                el.appendChild(b.element);
            }
            return this._proxy;
        },

        /**
         * Добавляет несколько дочерних элементов
         * Принимает массив билдеров, DOM-элементов, или их смесь
         *
         * @param {Array} arr - массив билдеров или DOM-элементов
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Пример:
         *   .children([
         *     dom.h1().text("Title"),
         *     dom.p().text("Paragraph"),
         *     dom.button().text("Click").click(handler),
         *     existingElement  // можно DOM-элемент
         *   ])
         */
        children(arr) {
            arr.forEach(b => {
                if (b instanceof HTMLElement) {
                    el.appendChild(b);
                } else if (b && b.element instanceof HTMLElement) {
                    el.appendChild(b.element);
                }
            });
            return this._proxy;
        },

        /**
         * Условный рендеринг: показывает элемент только если условие истинно
         * Поддерживает как обычное значение, так и сигнал
         *
         * @param {boolean|Function} condition - условие или сигнал с булевым значением
         * @param {Function} callback - коллбэк, получает билдер: (builder) => builder.text("...")
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .if(true, el => el.text("Показано"))
         *   .if(isVisible, el => el.text("Видно"))  // сигнал
         *   .if(isAdmin.map(a => a && isActive()), el => el.text("Админ активен"))
         */
        if(condition, callback) {
            const apply = (value) => {
                if (value) {
                    callback(this._proxy);
                }
            };

            if (isSignal(condition)) {
                condition.on(value => {
                    // Очищаем предыдущий контент
                    el.innerHTML = '';
                    if (value) {
                        callback(this._proxy);
                    }
                });
                // Применяем сразу
                apply(condition());
            } else {
                apply(condition);
            }
            return this._proxy;
        },

        /**
         * Условный рендеринг: показывает элемент только если условие ложно
         * Поддерживает как обычное значение, так и сигнал
         *
         * @param {boolean|Function} condition - условие или сигнал с булевым значением
         * @param {Function} callback - коллбэк, получает билдер: (builder) => builder.text("...")
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .unless(false, el => el.text("Показано"))
         *   .unless(isVisible, el => el.text("Скрыто"))  // сигнал
         */
        unless(condition, callback) {
            const apply = (value) => {
                if (!value) {
                    callback(this._proxy);
                }
            };

            if (isSignal(condition)) {
                condition.on(value => {
                    el.innerHTML = '';
                    if (!value) {
                        callback(this._proxy);
                    }
                });
                apply(condition());
            } else {
                apply(condition);
            }
            return this._proxy;
        },

        /**
         * Реактивный цикл: создаёт дочерние элементы для каждого элемента массива
         * При изменении сигнала-массива DOM автоматически перестраивается
         *
         * @param {Array|Function} items - массив или сигнал с массивом
         * @param {Function} callback - коллбэк для каждого элемента: (item, index) => builder
         * @returns {Proxy} - this для цепочек вызовов
         *
         * Примеры:
         *   .each(['а', 'б'], (item, i) => dom.li().text(`${i + 1}. ${item}`))
         *   .each(itemsSignal, (item, i) => dom.li().text(item.name))
         */
        each(items, callback) {
            const render = (arr) => {
                // Очищаем контейнер
                el.innerHTML = '';
                // Создаём элементы для каждого элемента массива
                arr.forEach((item, index) => {
                    const childBuilder = callback(item, index);
                    if (childBuilder instanceof HTMLElement) {
                        el.appendChild(childBuilder);
                    } else if (childBuilder && childBuilder.element instanceof HTMLElement) {
                        el.appendChild(childBuilder.element);
                    }
                });
            };

            if (isSignal(items)) {
                items.on(newArray => {
                    if (Array.isArray(newArray)) {
                        render(newArray);
                    }
                });
                // Рендерим начальное состояние
                const current = items();
                if (Array.isArray(current)) {
                    render(current);
                }
            } else if (Array.isArray(items)) {
                render(items);
            }

            return this._proxy;
        },

        /**
         * Завершает цепочку вызовов и возвращает готовый DOM-элемент
         * Это терминальный метод — после него fluent-цепочка заканчивается
         *
         * @returns {HTMLElement} - построенный DOM-элемент
         *
         * Пример:
         *   const myDiv = dom.div("main").cls("container").text("Hello").done();
         *   document.body.appendChild(myDiv);
         */
        done() {
            return el;
        }
    };

    /**
     * Прокси для автоматического создания шорткатов событий
     *
     * Правило: если свойство не найдено в builder,
     * оно считается именем события.
     *
     * Порядок проверки:
     * 1. Свойство существует в builder → возвращаем как есть
     * 2. Имя зарезервировано (RESERVED) → undefined
     * 3. Символ → undefined
     * 4. Есть в словаре EVENT_ALIASES → используем правильное имя события
     * 5. Всё остальное → camelCase → kebab-case
     */
    const proxy = new Proxy(builder, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (RESERVED.has(prop)) return undefined;
            if (typeof prop === 'symbol') return undefined;
            if (EVENT_ALIASES[prop]) {
                const eventName = EVENT_ALIASES[prop];
                return (handler) => target.on(eventName, handler);
            }
            const event = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            return (handler) => target.on(event, handler);
        }
    });

    // СОХРАНЯЕМ ССЫЛКУ НА ПРОКСИ В БИЛДЕРЕ
    builder._proxy = proxy;

    return proxy;
}


// ============================================================
// ПОЛНАЯ ДОКУМЕНТАЦИЯ
// ============================================================

/**
 * ============================================================
 * БИБЛИОТЕКА dom — МИНИМАЛИСТИЧНЫЙ DOM-БИЛДЕР С РЕАКТИВНОСТЬЮ
 * ============================================================
 *
 * СОДЕРЖАНИЕ:
 * 1. Создание элементов
 * 2. Методы билдера
 * 3. Сигналы (реактивность)
 * 4. События
 * 5. Стилизация
 * 6. Дочерние элементы
 * 7. Условный рендеринг и циклы
 * 8. Примеры
 *
 * ============================================================
 * 1. СОЗДАНИЕ ЭЛЕМЕНТОВ
 * ============================================================
 *
 * dom.tag("id")           - создаёт <tag id="id">
 * dom.tag()               - создаёт <tag> (без id)
 * dom.customEl("id")      - создаёт <custom-el id="id"> (camelCase → kebab-case)
 * dom['custom-el']("id")  - создаёт <custom-el id="id"> (явное указание дефиса)
 *
 * Поддерживаются ВСЕ HTML-теги и Custom Elements.
 *
 * Примеры:
 *   dom.div("main")
 *   dom.span()
 *   dom.h1("title")
 *   dom.input()
 *   dom.wcInclude("my-component")     // <wc-include id="my-component">
 *   dom['my-custom-element']("app")   // <my-custom-element id="app">
 *
 * ============================================================
 * 2. МЕТОДЫ БИЛДЕРА
 * ============================================================
 *
 * Все методы возвращают this (кроме .done()), поэтому их можно
 * объединять в цепочки (fluent interface).
 *
 * Методы, поддерживающие сигналы, автоматически подписываются
 * на изменения и обновляют DOM при смене значения сигнала.
 *
 * .id(id)               - установить id элемента
 *   Пример: .id("main")
 *
 * .cls(classes)          - добавить класс(ы) через пробел (или сигнал)
 *   Пример: .cls("btn primary")
 *   С сигналом: .cls(isActive)  // true → класс добавится, false → уберётся
 *   Производный: .cls(isActive.map(v => v ? "on" : "off"))
 *
 * .atr(key, value)       - установить один атрибут (или сигнал)
 *   Пример: .atr("disabled", true)
 *   С сигналом: .atr("disabled", isDisabled)
 *   data/aria: .atr("data-id", "123"), .atr("aria-label", "Close")
 *
 * .atrs({...})           - установить несколько атрибутов разом
 *   Пример: .atrs({ id: "main", "data-id": "123", tabindex: 0 })
 *
 * .text(str)             - установить текстовое содержимое (безопасно, или сигнал)
 *   Пример: .text("Hello")
 *   С сигналом: .text(count)
 *   Производный: .text(count.map(v => `Счёт: ${v}`))
 *
 * .html(str)             - установить HTML-содержимое (или сигнал)
 *   ВНИМАНИЕ: потенциальная XSS-уязвимость
 *   Пример: .html("<b>Bold</b>")
 *   С сигналом: .html(content)
 *
 * .css(str)              - добавить инлайн-стили (или сигнал)
 *   Пример: .css("display: flex; gap: 16px;")
 *   С сигналом: .css(theme.map(t => t === 'dark' ? "bg: #000;" : "bg: #fff;"))
 *
 * .pcss(pseudo, str)     - стили для псевдоклассов/псевдоэлементов (или сигнал)
 *   Пример: .pcss(":hover", "opacity: 0.8;")
 *   Пример: .pcss("::before", "content: ''; display: block;")
 *   С сигналом: .pcss(":hover", hoverStyle)
 *
 * .mcss(query, str)      - стили внутри медиа-запроса (или сигнал)
 *   Пример: .mcss("(max-width: 768px)", "flex-direction: column;")
 *   Пример: .mcss("(prefers-color-scheme: dark)", "background: #1a1a1a;")
 *   С сигналом: .mcss("(max-width: 768px)", responsiveStyles)
 *
 * .on(event, handler)    - добавить обработчик события
 *   Пример: .on("click", () => alert("clicked"))
 *   Пример: .on("keydown", e => { if (e.key === 'Enter') submit(); })
 *
 * .child(builder)        - добавить один дочерний элемент (билдер или DOM-элемент)
 *   Пример: .child(dom.span().text("Hello"))
 *   Пример: .child(existingDOMElement)
 *
 * .children([...])       - добавить несколько дочерних элементов (массив билдеров или DOM-элементов)
 *   Пример: .children([dom.h1().text("Title"), dom.p().text("Text")])
 *   Пример: .children([existingElement, dom.div().text("new")])
 *
 * .if(condition, cb)     - условный рендеринг (показать если условие истинно)
 *   Пример: .if(isAdmin, el => el.cls('admin').text('Админ'))
 *   С сигналом: .if(isVisible, el => el.text('Видно'))
 *
 * .unless(condition, cb) - условный рендеринг (показать если условие ложно)
 *   Пример: .unless(isLoading, el => el.text('Загружено'))
 *   С сигналом: .unless(isVisible, el => el.text('Скрыто'))
 *
 * .each(items, cb)       - реактивный цикл по массиву (сигнал или обычный массив)
 *   Пример: .each(['а','б'], (item, i) => dom.li().text(`${i+1}. ${item}`))
 *   С сигналом: .each(itemsSignal, (item) => dom.li().text(item.name))
 *
 * .done()                - завершить цепочку и получить готовый DOM-элемент
 *   ВАЖНО: после .done() цепочка заканчивается, это терминальный метод
 *   Пример: document.body.appendChild(dom.div().text("Hi").done());
 *
 * ============================================================
 * 3. СИГНАЛЫ (РЕАКТИВНОСТЬ)
 * ============================================================
 *
 * dom.signal(value)      - создать реактивный сигнал
 * signal()               - получить текущее значение
 * signal(newValue)       - установить новое значение
 * signal.value           - альтернативный доступ через свойство (get/set)
 * signal.map(fn)         - создать производный сигнал
 * signal.on(fn)          - подписаться на изменения, возвращает функцию отписки
 *
 * Сигнал можно передавать напрямую в методы .text(), .cls(), .atr(),
 * .css(), .pcss(), .mcss(), .html(), .if(), .unless(), .each().
 * Библиотека автоматически подпишется и будет обновлять DOM.
 *
 * Производные сигналы (.map) создают новый сигнал, который
 * автоматически обновляется при изменении родительского.
 *
 * Примеры:
 *   const count = dom.signal(0);
 *   const doubled = count.map(v => v * 2);
 *   const isPositive = count.map(v => v > 0);
 *   count(5);  // doubled() → 10, isPositive() → true
 *
 * ============================================================
 * 4. СОБЫТИЯ
 * ============================================================
 *
 * Явный метод:
 *   .on("eventname", handler)
 *
 * Шорткаты через прокси (camelCase):
 *   .click(fn)          → .on('click', fn)
 *   .dblclick(fn)       → .on('dblclick', fn)
 *   .mouseEnter(fn)     → .on('mouseenter', fn)
 *   .keyDown(fn)        → .on('keydown', fn)
 *   .animationEnd(fn)   → .on('animationend', fn)
 *   .transitionEnd(fn)  → .on('transitionend', fn)
 *   .customEvent(fn)    → .on('custom-event', fn)  (произвольные события)
 *
 * Правила преобразования имён:
 * - Стандартные слитные события (keydown, mouseenter, animationend)
 *   используют словарь EVENT_ALIASES
 * - Всё остальное: camelCase → kebab-case
 *   (myEvent → my-event, customUpdate → custom-update)
 *
 * ============================================================
 * 5. СТИЛИЗАЦИЯ
 * ============================================================
 *
 * Три метода для разных уровней CSS:
 *
 * .css("стили")          - инлайн-стили элемента
 *   Для обычных стилей элемента
 *   .css("display: flex; padding: 16px;")
 *
 * .pcss(":псевдо", "стили")  - стили для псевдоклассов и псевдоэлементов
 *   Создаёт <style> в <head> с уникальным классом
 *   .pcss(":hover", "opacity: 0.8;")
 *   .pcss("::before", "content: '→'; margin-right: 8px;")
 *
 * .mcss("(медиа-запрос)", "стили")  - стили внутри медиа-запроса
 *   Создаёт <style> в <head> с @media
 *   .mcss("(max-width: 768px)", "flex-direction: column;")
 *   .mcss("(prefers-color-scheme: dark)", "background: #1a1a1a;")
 *
 * Все три метода поддерживают сигналы.
 *
 * ============================================================
 * 6. ДОЧЕРНИЕ ЭЛЕМЕНТЫ
 * ============================================================
 *
 * .child() и .children() принимают:
 * - Билдеры (результат dom.tag() без .done())
 * - DOM-элементы (результат .done() или document.createElement())
 * - Прокси-билдеры
 * - Смесь всего вышеперечисленного
 *
 * ВАЖНО: элементы, переданные в .children(), не должны иметь .done().
 * .done() вызывается только один раз — на самом верхнем элементе.
 *
 * ============================================================
 * 7. УСЛОВНЫЙ РЕНДЕРИНГ И ЦИКЛЫ
 * ============================================================
 *
 * .if(condition, callback)    - показать содержимое если condition истинно
 *   @param {boolean|Function} condition - условие или сигнал с булевым значением
 *   @param {Function} callback - (builder) => builder.text("...")
 *
 *   // Статическое условие
 *   dom.div().if(user.isAdmin, el => el.text('Админ-панель'))
 *
 *   // Реактивное условие (сигнал)
 *   const isVisible = dom.signal(true);
 *   dom.div().if(isVisible, el => el.text('Видно'))
 *
 *   // С производным сигналом
 *   dom.div().if(isAdmin.map(a => a && isActive()), el => el.text('Активен'))
 *
 * .unless(condition, callback) - показать содержимое если condition ложно
 *   @param {boolean|Function} condition - условие или сигнал
 *   @param {Function} callback - (builder) => builder.text("...")
 *
 *   dom.div().unless(isLoading, el => el.text('Контент загружен'))
 *   dom.div().unless(isEmpty.map(e => e), el => el.text('Есть элементы'))
 *
 * .each(items, callback)       - реактивный цикл по массиву
 *   @param {Array|Function} items - массив или сигнал с массивом
 *   @param {Function} callback - (item, index) => builder
 *
 *   // Статический массив
 *   dom.ul().each(['а', 'б', 'в'], (item, i) =>
 *     dom.li().text(`${i + 1}. ${item}`)
 *   )
 *
 *   // Реактивный массив (сигнал) — DOM перестраивается при изменении
 *   const items = dom.signal([{name: 'Первый'}, {name: 'Второй'}]);
 *   dom.ul().each(items, (item, i) =>
 *     dom.li().text(item.name)
 *   )
 *
 *   // Добавление элемента автоматически обновит список
 *   items([...items(), {name: 'Третий'}]);
 *
 *   // Удаление тоже
 *   items(items().filter(item => item.name !== 'Второй'));
 *
 * Все три метода поддерживают и обычные значения, и сигналы.
 * При использовании сигналов DOM обновляется автоматически.
 *
 * ============================================================
 * 8. ПРИМЕРЫ
 * ============================================================
 *
 * Простой счётчик:
 *   const count = dom.signal(0);
 *   const counter = dom.div()
 *     .children([
 *       dom.button().text("-").click(() => count(count() - 1)),
 *       dom.span().text(count),
 *       dom.button().text("+").click(() => count(count() + 1)),
 *     ])
 *     .done();
 *   document.body.appendChild(counter);
 *
 * Форма с валидацией:
 *   const email = dom.signal("");
 *   const isValid = email.map(v => v.includes("@"));
 *   const form = dom.div()
 *     .children([
 *       dom.input().atrs({ type: "email", placeholder: "Email" })
 *         .on("input", e => email(e.target.value))
 *         .css(isValid.map(v => v ? "border-color: green;" : "border-color: red;")),
 *       dom.button().text("Submit").atr("disabled", isValid.map(v => !v)),
 *     ])
 *     .done();
 *
 * Карточка с ховером и адаптивом:
 *   const card = dom.div()
 *     .cls("card")
 *     .css("padding: 24px; background: #fff; border-radius: 12px;")
 *     .pcss(":hover", "box-shadow: 0 4px 12px rgba(0,0,0,0.1);")
 *     .mcss("(max-width: 768px)", "padding: 16px;")
 *     .child(dom.h2().text("Title"))
 *     .done();
 *
 * Условный рендеринг:
 *   const isLoggedIn = dom.signal(false);
 *   const app = dom.div()
 *     .if(isLoggedIn, el => el.text('Добро пожаловать!'))
 *     .unless(isLoggedIn, el => el.text('Войдите в систему'))
 *     .done();
 *
 * Реактивный список:
 *   const todos = dom.signal(['Купить хлеб', 'Позвонить маме']);
 *   const list = dom.div()
 *     .children([
 *       dom.h2().text('Список задач'),
 *       dom.ul().each(todos, (todo, i) =>
 *         dom.li()
 *           .text(todo)
 *           .click(() => {
 *             const updated = [...todos()];
 *             updated.splice(i, 1);
 *             todos(updated);
 *           })
 *       ),
 *       dom.button()
 *         .text('Добавить')
 *         .click(() => todos([...todos(), `Задача ${todos().length + 1}`])),
 *     ])
 *     .done();
 *
 * ПРИНЦИПЫ:
 * - Один тег = одна функция = одна цепочка
 * - .done() только в конце, перед вставкой в DOM
 * - Сигналы передаются напрямую, без () =>
 * - Стили в родном CSS-синтаксисе (строками)
 * - События через .on() или шорткаты .click(), .keyDown() и т.д.
 * - .children() принимает и билдеры, и DOM-элементы
 * - .if() и .unless() для условного рендера
 * - .each() для реактивных списков
 * - При изменении сигнала всё что от него зависит обновляется само
 */