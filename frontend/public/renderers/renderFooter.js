// frontend/public/renderers/renderFooter.js
// (Этот файл содержит функцию рендеринга для футера)

export function renderFooter(appInstance, state) {
     // Рендерит футер с версией
     // --- ИЗМЕНЕНИЕ (v22.2): Обновляем версию ---
     const version = '22.2'; // (Примечание: эту версию, возможно, захочется обновлять в main.js, а не здесь)
     if (state.token) {
         return `<p>Контекстный тренажёр языка v${version}</p><p>Made by SaNSeY &copy; ${new Date().getFullYear()}.</p>`;
     }
     return '';
}
