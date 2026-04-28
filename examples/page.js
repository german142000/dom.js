// ============================================================
// СТРАНИЦА ПОЛНОГО ТЕСТА БИБЛИОТЕКИ dom (с .if, .unless, .each)
// ============================================================

// --- Стили ---
const pageStyle = document.createElement('style');
pageStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f7fa; color: #1a1a2e; padding: 24px; }
  .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 16px; }
  .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-danger { background: #ef4444; color: #fff; }
  .btn-success { background: #22c55e; color: #fff; }
  .btn-small { padding: 4px 10px; font-size: 12px; }
  .input { padding: 10px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }
  .input:focus { border-color: #4f46e5; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  h2 { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #4f46e5; }
  h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .todo-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
  .todo-item:hover { background: #f9fafb; }
  .completed { text-decoration: line-through; color: #9ca3af; }
`;
document.head.appendChild(pageStyle);


// ============================================================
// ТЕСТ 1: БАЗОВОЕ СОЗДАНИЕ ЭЛЕМЕНТОВ
// ============================================================
const test1 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 1: Базовое создание элементов'),

        dom.div()
            .css('display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;')
            .children([
                dom.div('test-id-arg')
                    .cls('badge')
                    .css('background: #e0e7ff; color: #4f46e5;')
                    .text('id через аргумент'),
                dom.div()
                    .id('test-id-method')
                    .cls('badge')
                    .css('background: #e0e7ff; color: #4f46e5;')
                    .text('id через .id()'),
            ]),

        dom.div()
            .css('display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;')
            .children([
                dom.span().cls('badge').css('background: #d1fae5; color: #065f46;').text('badge'),
                dom.span().cls('badge btn-primary').text('badge + btn-primary'),
                dom.span().cls('badge btn-danger btn-small').text('badge + btn-danger + btn-small'),
            ]),

        dom.div()
            .css('display: flex; gap: 16px; margin-bottom: 12px;')
            .children([
                dom.span().text('Обычный текст (textContent)'),
                dom.span().html('<b>Жирный текст (innerHTML)</b>'),
            ]),

        dom.div()
            .css('display: flex; gap: 8px; align-items: center;')
            .children([
                dom.input()
                    .cls('input')
                    .atrs({ type: 'text', placeholder: 'atrs: type, placeholder, data-test', 'data-test': 'hello' }),
                dom.button()
                    .cls('btn btn-primary')
                    .atr('title', 'Это подсказка через atr')
                    .text('Наведи на меня'),
            ]),
    ]);


// ============================================================
// ТЕСТ 2: СОБЫТИЯ
// ============================================================
const clickCount = dom.signal(0);
const mousePosition = dom.signal('—');
const eventLog = dom.signal([]);

const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    eventLog([...eventLog(), `[${time}] ${msg}`].slice(-5));
};

const test2 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 2: События'),

        dom.div()
            .css('display: flex; gap: 8px; align-items: center; margin-bottom: 12px;')
            .children([
                dom.button()
                    .cls('btn btn-primary')
                    .text('Кликни (.click)')
                    .click(() => {
                        clickCount(clickCount() + 1);
                        addLog('click');
                    }),
                dom.span().css('font-weight: 600;').text(clickCount.map(c => `Кликов: ${c}`)),
            ]),

        dom.div()
            .css('margin-bottom: 12px;')
            .child(
                dom.button()
                    .cls('btn btn-success')
                    .text('Двойной клик (.dblclick)')
                    .dblclick(() => addLog('dblclick'))
            ),

        dom.div()
            .css('display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;')
            .children([
                dom.div()
                    .cls('card')
                    .css('padding: 16px; background: #f9fafb; cursor: pointer;')
                    .on('mouseenter', () => addLog('mouseenter'))
                    .on('mouseleave', () => addLog('mouseleave'))
                    .on('mousemove', e => { mousePosition(`X: ${e.offsetX}, Y: ${e.offsetY}`); })
                    .text(mousePosition),
                dom.input()
                    .cls('input')
                    .atrs({ type: 'text', placeholder: 'Печатай здесь (.on keydown)' })
                    .on('keydown', e => { addLog(`keydown: "${e.key}"`); }),
                dom.input()
                    .cls('input')
                    .atrs({ type: 'text', placeholder: 'Фокус / потеря фокуса' })
                    .on('focus', () => addLog('focus'))
                    .on('blur', () => addLog('blur')),
            ]),

        // Лог событий (реактивный)
        dom.div()
            .cls('card')
            .css('padding: 12px; background: #1a1a2e; color: #22c55e; font-family: monospace; font-size: 13px; max-height: 120px; overflow-y: auto;')
            .children([
                dom.div().css('color: #fff; margin-bottom: 8px;').text('Лог событий:'),
                dom.div('event-log-container')
                    .each(eventLog, (msg) => dom.div().text(msg))
                    .if(eventLog.map(logs => logs.length === 0), el => el.text('(пусто)').css('color: #666;')),
            ]),
    ]);

// Подписка: если логов нет — показываем "(пусто)"
eventLog.on(logs => {
    const container = document.getElementById('event-log-container');
    if (!container) return;
    if (logs.length === 0) {
        container.innerHTML = '<span style="color: #666;">(пусто)</span>';
    }
});


// ============================================================
// ТЕСТ 3: РЕАКТИВНОСТЬ (СИГНАЛЫ)
// ============================================================
const counter = dom.signal(0);
const isActive = dom.signal(false);
const textInput = dom.signal('');

const test3 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 3: Реактивность (сигналы)'),

        dom.div()
            .css('display: flex; gap: 8px; align-items: center; margin-bottom: 12px;')
            .children([
                dom.button().cls('btn btn-primary').text('-').click(() => counter(counter() - 1)),
                dom.span().css('font-size: 24px; font-weight: 800; min-width: 40px; text-align: center;').text(counter),
                dom.button().cls('btn btn-primary').text('+').click(() => counter(counter() + 1)),
            ]),

        dom.div()
            .css('margin-bottom: 12px;')
            .children([
                dom.span().text('Статус: '),
                dom.strong().text(counter.map(c => c > 0 ? 'Положительное' : c < 0 ? 'Отрицательное' : 'Ноль')),
                dom.span().text(' | Удвоенное: '),
                dom.strong().text(counter.map(c => c * 2)),
            ]),

        dom.div()
            .css('display: flex; gap: 8px; align-items: center; margin-bottom: 12px;')
            .children([
                dom.button()
                    .cls('btn')
                    .cls(isActive.map(a => a ? 'btn-success' : 'btn-danger'))
                    .text(isActive.map(a => a ? 'Активен' : 'Неактивен'))
                    .click(() => isActive(!isActive())),
            ]),

        dom.div()
            .css('display: flex; gap: 8px; align-items: center; margin-bottom: 12px;')
            .children([
                dom.button()
                    .cls('btn btn-primary')
                    .text('Кнопка')
                    .atr('disabled', isActive.map(a => !a)),
                dom.span().css('font-size: 13px; color: #666;').text(isActive.map(a => a ? '(разблокирована)' : '(заблокирована)')),
            ]),

        dom.div()
            .cls('card')
            .css('padding: 16px; text-align: center; transition: all 0.3s;')
            .css(isActive.map(a => a ? 'background: #22c55e; color: #fff;' : 'background: #fef2f2; color: #991b1b;'))
            .text(isActive.map(a => a ? 'АКТИВЕН' : 'НЕАКТИВЕН')),

        dom.div()
            .css('margin-top: 12px;')
            .children([
                dom.input()
                    .cls('input')
                    .css('width: 100%;')
                    .atrs({ type: 'text', placeholder: 'Введи текст...' })
                    .on('input', e => textInput(e.target.value)),
                dom.div()
                    .css('margin-top: 8px; padding: 8px; background: #f9fafb; border-radius: 6px;')
                    .children([
                        dom.span().css('color: #666;').text('Ты ввёл: '),
                        dom.strong().text(textInput.map(t => t || '(пусто)')),
                        dom.span().css('color: #666; margin-left: 8px;').text(textInput.map(t => `(${t.length} симв.)`)),
                    ]),
            ]),
    ]);


// ============================================================
// ТЕСТ 4: СТИЛИ — CSS, PCSS, MCSS
// ============================================================
const hoverColor = dom.signal('rgba(79, 70, 229, 0.1)');

const test4 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 4: Стили (css, pcss, mcss)'),

        dom.div()
            .css('padding: 16px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border-radius: 8px; margin-bottom: 12px; text-align: center;')
            .text('Инлайн-стили через .css()'),

        dom.div()
            .css('display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;')
            .children([
                dom.button().cls('btn btn-primary').text(':hover').pcss(':hover', 'transform: scale(1.1);'),
                dom.button().cls('btn btn-success').text(':active').pcss(':active', 'transform: scale(0.9);'),
                dom.div()
                    .css('padding: 12px 20px; background: #f9fafb; border-radius: 8px;')
                    .pcss('::before', 'content: "📍 ";')
                    .pcss('::after', 'content: " ← псевдо"; color: #999; font-size: 12px;')
                    .text('::before и ::after'),
            ]),

        dom.div()
            .css('display: flex; gap: 8px; margin-bottom: 12px;')
            .children([
                dom.button().cls('btn btn-primary').text('Синий').click(() => hoverColor('rgba(79, 70, 229, 0.3)')),
                dom.button().cls('btn btn-danger').text('Красный').click(() => hoverColor('rgba(239, 68, 68, 0.3)')),
                dom.button().cls('btn btn-success').text('Зелёный').click(() => hoverColor('rgba(34, 197, 94, 0.3)')),
            ]),

        dom.div()
            .cls('card')
            .css('padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s;')
            .pcss(':hover', hoverColor.map(c => `background: ${c};`))
            .text('Наведи — цвет меняется (pcss + сигнал)'),

        dom.div()
            .css('margin-top: 12px;')
            .children([
                dom.h3().text('Медиа-запросы (.mcss):'),
                dom.div()
                    .cls('card')
                    .css('padding: 16px; background: #f9fafb;')
                    .mcss('(max-width: 600px)', 'background: #fef2f2 !important;')
                    .mcss('(min-width: 1200px)', 'background: #d1fae5 !important;')
                    .text('Измени ширину окна — фон поменяется'),
            ]),
    ]);


// ============================================================
// ТЕСТ 5: ДОЧЕРНИЕ ЭЛЕМЕНТЫ
// ============================================================
const extraElement = document.createElement('div');
extraElement.className = 'badge';
extraElement.style.cssText = 'background: #fef3c7; color: #92400e;';
extraElement.textContent = 'DOM-элемент';

const test5 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 5: Дочерние элементы'),

        dom.div()
            .css('margin-bottom: 8px;')
            .child(dom.span().cls('badge').css('background: #e0e7ff; color: #4f46e5;').text('Через .child()')),

        dom.div()
            .css('display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;')
            .children([
                dom.span().cls('badge').css('background: #d1fae5; color: #065f46;').text('Элемент 1'),
                dom.span().cls('badge').css('background: #fce7f3; color: #9d174d;').text('Элемент 2'),
                dom.span().cls('badge').css('background: #e0e7ff; color: #4f46e5;').text('Элемент 3'),
            ]),

        dom.div()
            .css('margin-bottom: 12px; display: flex; gap: 8px; align-items: center;')
            .children([
                dom.span().text('DOM-элемент:'),
                extraElement,
            ]),

        dom.div()
            .cls('card')
            .css('padding: 16px; background: #f9fafb;')
            .children([
                dom.h3().text('Вложенная структура'),
                dom.div()
                    .css('display: flex; gap: 8px;')
                    .children([
                        dom.div().cls('card').css('flex: 1; padding: 12px; text-align: center;').text('Блок 1'),
                        dom.div().cls('card').css('flex: 1; padding: 12px; text-align: center;').text('Блок 2'),
                    ]),
            ]),
    ]);


// ============================================================
// ТЕСТ 6: CUSTOM ELEMENTS
// ============================================================
const test6 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 6: Custom Elements и kebab-case'),
        dom.p().css('margin-bottom: 8px;').text('dom.myCustomElement("test") → <my-custom-element id="test">'),
        dom.p().text("dom['my-el']('test') → <my-el id='test'>"),
    ]);


// ============================================================
// ТЕСТ 7: СИГНАЛЫ — .on() И .map()
// ============================================================
const signalValue = dom.signal(10);
const derivedValue = signalValue.map(v => v * 2);

const test7 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 7: Сигналы — .on() и .map()'),

        dom.div()
            .css('display: flex; gap: 8px; align-items: center; margin-bottom: 12px;')
            .children([
                dom.button().cls('btn btn-primary').text('-5').click(() => signalValue(signalValue() - 5)),
                dom.button().cls('btn btn-primary').text('+5').click(() => signalValue(signalValue() + 5)),
                dom.span().css('font-weight: 600;').text(signalValue.map(v => `Значение: ${v}`)),
            ]),

        dom.div()
            .css('margin-bottom: 12px;')
            .children([
                dom.span().text('Исходное: '),
                dom.strong().text(signalValue),
                dom.span().text(' | ×2: '),
                dom.strong().text(derivedValue),
                dom.span().text(' | Квадрат: '),
                dom.strong().text(signalValue.map(v => v * v)),
            ]),

        dom.div()
            .css('padding: 12px; background: #f9fafb; border-radius: 8px;')
            .text('signal.on() логирует изменения в консоль'),
    ]);

signalValue.on((newVal, oldVal) => {
    console.log(`[signal.on] ${oldVal} → ${newVal}`);
});


// ============================================================
// ТЕСТ 8: РЕАКТИВНЫЙ СПИСОК ЧЕРЕЗ .each()
// ============================================================
const listItems = dom.signal(['Первый', 'Второй', 'Третий']);
const newItemText = dom.signal('');

const test8 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 8: Реактивный список (.each)'),

        dom.div()
            .css('display: flex; gap: 8px; margin-bottom: 12px;')
            .children([
                dom.input()
                    .cls('input')
                    .css('flex: 1;')
                    .atrs({ type: 'text', placeholder: 'Новый элемент...' })
                    .on('input', e => newItemText(e.target.value))
                    .on('keydown', e => {
                        if (e.key === 'Enter' && newItemText().trim()) {
                            listItems([...listItems(), newItemText().trim()]);
                            newItemText('');
                            e.target.value = '';
                        }
                    }),
                dom.button()
                    .cls('btn btn-primary')
                    .text('Добавить')
                    .click(() => {
                        if (newItemText().trim()) {
                            listItems([...listItems(), newItemText().trim()]);
                            newItemText('');
                        }
                    }),
            ]),

        dom.div()
            .css('font-weight: 600; margin-bottom: 8px;')
            .text(listItems.map(items => `Элементов: ${items.length}`)),

        // РЕАКТИВНЫЙ СПИСОК ЧЕРЕЗ .each() — вот тут магия!
        dom.ul()
            .css('list-style: none; padding: 0; margin-bottom: 12px;')
            .each(listItems, (item, index) =>
                dom.li()
                    .cls('todo-item')
                    .children([
                        dom.span().text(`${index + 1}. ${item}`),
                        dom.button()
                            .cls('btn btn-small btn-danger')
                            .text('×')
                            .click(() => {
                                const newList = [...listItems()];
                                newList.splice(index, 1);
                                listItems(newList);
                            }),
                    ])
            ),

        dom.div()
            .css('display: flex; gap: 8px;')
            .children([
                dom.button()
                    .cls('btn btn-danger')
                    .text('Очистить всё')
                    .click(() => listItems([])),
                dom.button()
                    .cls('btn btn-primary')
                    .text('Добавить 3 случайных')
                    .click(() => {
                        const words = ['Яблоко', 'Банан', 'Груша', 'Киви', 'Манго', 'Ананас'];
                        const r = () => words[Math.floor(Math.random() * words.length)] + ' ' + words[Math.floor(Math.random() * words.length)];
                        listItems([...listItems(), r(), r(), r()]);
                    }),
            ]),
    ]);


// ============================================================
// ТЕСТ 9: УСЛОВНЫЙ РЕНДЕРИНГ — .if() и .unless()
// ============================================================
const showContent = dom.signal(true);
const userRole = dom.signal('user'); // 'admin' | 'user' | 'guest'

const test9 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 9: Условный рендеринг (.if и .unless)'),

        // Тогл для showContent
        dom.div()
            .css('display: flex; gap: 8px; align-items: center; margin-bottom: 12px;')
            .children([
                dom.button()
                    .cls('btn btn-primary')
                    .text(showContent.map(v => v ? 'Скрыть' : 'Показать'))
                    .click(() => showContent(!showContent())),
                dom.span().css('color: #666; font-size: 13px;').text('переключает .if'),
            ]),

        // Условный блок: .if()
        dom.div()
            .cls('card')
            .css('padding: 16px; margin-bottom: 12px;')
            .if(showContent, el => el
                .css('background: #d1fae5; text-align: center;')
                .text('✅ Этот блок виден через .if(showContent)')
            )
            .unless(showContent, el => el
                .css('background: #fef2f2; text-align: center;')
                .text('❌ Этот блок виден через .unless(showContent)')
            ),

        // Переключатель роли
        dom.div()
            .css('display: flex; gap: 8px; margin-bottom: 12px;')
            .children([
                dom.button().cls('btn btn-primary').text('Гость').click(() => userRole('guest')),
                dom.button().cls('btn btn-primary').text('Пользователь').click(() => userRole('user')),
                dom.button().cls('btn btn-primary').text('Админ').click(() => userRole('admin')),
                dom.span().css('font-weight: 600; margin-left: 8px;').text(userRole.map(r => `Роль: ${r}`)),
            ]),

        // Условный рендер по роли
        dom.div()
            .cls('card')
            .css('padding: 16px; background: #f9fafb;')
            .children([
                dom.h3().text('Панель управления:'),
                dom.div()
                    .if(userRole.map(r => r === 'admin'), el => el
                        .css('padding: 12px; background: #fef3c7; border-radius: 6px; margin-bottom: 4px;')
                        .text('🔧 Админ-панель: управление пользователями')
                    ),
                dom.div()
                    .if(userRole.map(r => r === 'admin' || r === 'user'), el => el
                        .css('padding: 12px; background: #e0e7ff; border-radius: 6px; margin-bottom: 4px;')
                        .text('📝 Контент для авторизованных')
                    ),
                dom.div()
                    .unless(userRole.map(r => r === 'admin'), el => el
                        .css('padding: 12px; background: #fef2f2; border-radius: 6px;')
                        .text('🔒 Админ-панель скрыта (нужна роль admin)')
                    ),
            ]),
    ]);


// ============================================================
// ТЕСТ 10: КОМБИНАЦИЯ — if + each
// ============================================================
// Тест 10: КОМБИНАЦИЯ — if + each (список задач)
const todoItems = dom.signal([
    { text: 'Изучить dom.if()', done: true },
    { text: 'Изучить dom.unless()', done: true },
    { text: 'Изучить dom.each()', done: false },
    { text: 'Выложить на GitHub', done: false },
]);

const rebuildTodoList = (items) => {
    const container = document.getElementById('todo-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (items.length === 0) {
        const empty = dom.div()
            .css('padding: 16px; text-align: center; color: #9ca3af;')
            .text('Все задачи выполнены! 🎉')
            .done();
        container.appendChild(empty);
        return;
    }

    const list = dom.ul()
        .css('list-style: none; padding: 0;')
        .each(items, (todo, index) =>
            dom.li()
                .cls('todo-item')
                .children([
                    dom.span()
                        .css(todo.done ? 'text-decoration: line-through; color: #9ca3af;' : '')
                        .text(`${index + 1}. ${todo.text}`),
                    dom.button()
                        .cls('btn btn-small btn-success')
                        .text(todo.done ? '↩' : '✓')
                        .click(() => {
                            const updated = [...todoItems()];
                            updated[index] = { ...updated[index], done: !updated[index].done };
                            todoItems(updated);
                        }),
                ])
        )
        .done();
    container.appendChild(list);
};

const test10 = dom.div()
    .cls('card')
    .children([
        dom.h2().text('Тест 10: Комбинация .if + .each (список задач)'),

        dom.div()
            .css('margin-bottom: 8px; font-weight: 600;')
            .text(todoItems.map(items => `Задач: ${items.length} (выполнено: ${items.filter(i => i.done).length})`)),

        dom.div('todo-list-container'),

        dom.div()
            .css('display: flex; gap: 8px; margin-top: 12px;')
            .children([
                dom.button()
                    .cls('btn btn-primary')
                    .text('Добавить задачу')
                    .click(() => todoItems([...todoItems(), { text: `Задача ${todoItems().length + 1}`, done: false }])),
                dom.button()
                    .cls('btn btn-danger')
                    .text('Удалить выполненные')
                    .click(() => todoItems(todoItems().filter(t => !t.done))),
                dom.button()
                    .cls('btn btn-success')
                    .text('Выполнить все')
                    .click(() => todoItems(todoItems().map(t => ({ ...t, done: true })))),
            ]),
    ]);

// Подписка на обновление
todoItems.on(items => rebuildTodoList(items));
// Начальная отрисовка
setTimeout(() => rebuildTodoList(todoItems()), 0);


// ============================================================
// СБОРКА
// ============================================================
const container = dom.div()
    .css('max-width: 800px; margin: 0 auto;')
    .children([
        dom.div()
            .css('text-align: center; margin-bottom: 24px;')
            .children([
                dom.h1().css('font-size: 32px; font-weight: 800; color: #4f46e5;').text('🧪 Полный тест библиотеки dom'),
                dom.p().css('color: #6b7280; margin-top: 8px;').text('Все функции включая .if, .unless, .each'),
            ]),
        test1,
        test2,
        test3,
        test4,
        test5,
        test6,
        test7,
        test8,
        test9,
        test10,
        dom.footer()
            .css('text-align: center; padding: 24px; color: #9ca3af; font-size: 13px;')
            .text('Библиотека dom — полный тест завершён ✅'),
    ])
    .done();

document.body.appendChild(container);

console.log('=== Страница теста dom загружена ===');
console.log('✅ Создание элементов, атрибуты, стили, события');
console.log('✅ Сигналы, pcss, mcss, дочерние элементы');
console.log('✅ .if() — условный рендеринг');
console.log('✅ .unless() — обратный условный рендеринг');
console.log('✅ .each() — реактивные списки');
console.log('✅ Комбинация .if + .each');