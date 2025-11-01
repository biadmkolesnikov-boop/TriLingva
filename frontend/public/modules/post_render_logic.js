// frontend/public/modules/post_render_logic.js
// Этот модуль содержит логику, которая должна выполняться
// сразу после обновления appEl.innerHTML в методе render().
// Сюда входит восстановление позиций прокрутки и логика фокуса.

/**
 * Применяет эффекты, зависящие от DOM, после рендеринга.
 * (Восстановление прокрутки, фокус на элементах и т.д.)
 * @param {App} appInstance - Экземпляр App.
 * @param {string} currentActualScreen - Название экрана, который был отрисован.
 */
export function applyPostRenderEffects(appInstance, currentActualScreen) {
    
    try {
        const state = appInstance.state;
        const editor = state.editor;
        
        // 1. Восстановление прокрутки для Настроек
        if (currentActualScreen === 'userSettings' && appInstance.settingsScrollPosition > 0) {
             setTimeout(() => {
                 const scrollWrapperAfter = document.querySelector('.tab-content-wrapper');
                 if (scrollWrapperAfter) {
                     scrollWrapperAfter.scrollTop = appInstance.settingsScrollPosition;
                     console.log("Restored settings scroll position to:", appInstance.settingsScrollPosition);
                 }
                 appInstance.settingsScrollPosition = 0; // Сбрасываем сохраненную позицию
             }, 50); // Небольшая задержка, чтобы DOM успел "осесть"
        }

        // 2. Привязка обработчиков предпросмотра темы (логично делать это здесь)
        if (currentActualScreen === 'userSettings' && state.settingsActiveTab === 'admin_theme') {
            appInstance.attachThemePreviewHandlers();
        }

        // 3. Восстановление прокрутки для Редактора Словарей
        if (currentActualScreen === 'dictionaryEditor' && appInstance.scrollPosition > 0) { // Используем общий scrollPosition
             setTimeout(() => { 
                 const el = document.querySelector('.dict-editor-table')?.parentElement; 
                 if (el) el.scrollTop = appInstance.scrollPosition;
                 appInstance.scrollPosition = 0;
             }, 50);
        }
        
        // 4. Восстановление прокрутки для Выбора Слов
        if (currentActualScreen === 'wordSelection' && appInstance.scrollPosition > 0) {
             setTimeout(() => { 
                 const el = document.querySelector('.dictionary-view-container'); 
                 if (el) el.scrollTop = appInstance.scrollPosition; 
                 appInstance.scrollPosition = 0; 
             }, 50);
        }

        // 5. Логика фокуса на слове в Редакторе Словарей
        if (editor?.focusOnWord && currentActualScreen === 'dictionaryEditor') {
            const focusWord = editor.focusOnWord;
             editor.focusOnWord = null; // Очищаем сразу
             setTimeout(() => {
                 // Ищем инпут, значение которого совпадает с искомым словом
                 const inputs = Array.from(document.querySelectorAll('.dict-editor-table input[type="text"][id^="ru-"]'));
                 const targetInput = inputs.find(input => input.value === focusWord);
                 
                 if (targetInput) {
                     const targetRow = targetInput.closest('tr');
                     if (targetRow) {
                         // Прокручиваем к ряду
                         targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                         // Подсвечиваем ряд
                         targetRow.classList.add('row-highlight');
                         setTimeout(() => targetRow.classList.remove('row-highlight'), 2500); // Снимаем подсветку
                     }
                 }
             }, 150); // Задержка, чтобы DOM точно был готов
        }

    } catch (postRenderError) {
         console.error("Error during post-rendering effects:", postRenderError);
    }
}
