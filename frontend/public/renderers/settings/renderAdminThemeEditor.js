// frontend/public/renderers/settings/renderAdminThemeEditor.js (ПОЛНЫЙ ОБНОВЛЕННЫЙ КОД v18.10)

// Словарь для "человеческих" имен CSS переменных в редакторе тем
const THEME_VAR_NAMES = new Map([
    ["--bg-grad-start", "Фон (Градиент Старт)"],
    ["--bg-grad-end", "Фон (Градиент Конец)"],
    ["--accent-color", "Акцент (Кнопки)"],
    ["--accent-hover", "Акцент (Кнопки Наведение)"],
    ["--text-color", "Основной Текст"],
    ["--bg-color", "Фон Контейнера"],
    ["--paper-color", "Фон Карточек (Бумага)"],
    ["--success-color", "Цвет Успеха"],
    ["--danger-color", "Цвет Ошибки/Выхода"],
    ["--gold-color", "Цвет Золота (Награды)"]
]);

export function renderAdminThemeEditor(state, appInstance) {
    if (!appInstance.isAdmin()) return '';
    let adminThemeEditorHTML = '';

    // ID активной темы для редактирования: берем из редактора ИЛИ активную глобальную ИЛИ первую в списке
    const activeEditThemeId = state.editor.activeThemeEditId || (state.themes.length > 0 ? state.themes.find(t => t.is_active)?.id || state.themes[0].id : null);
    const activeTheme = state.themes.find(t => t.id === activeEditThemeId);

    if (state.themeEditorLoaded && state.themes.length > 0) {
        // 1. Панель кнопок выбора темы (с прокруткой)
        const themeSelectorButtons = state.themes
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(theme => 
                 `<button class="button small ${activeEditThemeId === theme.id ? '' : 'secondary'}"
                          onclick="app.setEditorState('activeThemeEditId', '${theme.id}')">
                     ${theme.name} ${theme.is_active ? ' (Глобальная)' : ''}
                  </button>`
            ).join('');

        // 2. Детальный редактор (только для активной темы)
        let themeEditorHTML = '';
        if (activeTheme) {
            const theme = activeTheme;
            const colorsObject = typeof theme.colors === 'string' ? JSON.parse(theme.colors) : theme.colors;
            const sortedKeys = Object.keys(colorsObject).sort((a, b) => {
               const aKnown = THEME_VAR_NAMES.has(a);
               const bKnown = THEME_VAR_NAMES.has(b);
               if (aKnown && !bKnown) return -1;
               if (!aKnown && bKnown) return 1;
               return a.localeCompare(b);
            });
            
            const colorsHTML = sortedKeys.map(key => {
                const value = colorsObject[key];
                const labelName = THEME_VAR_NAMES.get(key) || key;
                return `
                <div class="color-input-group">
                    <label for="${theme.id}-${key.replace('--','')}" title="${key}">${labelName}</label>
                    <input type="color" value="${value}" data-theme-id="${theme.id}" data-color-var="${key}" class="color-picker-input">
                    <input type="text" id="${theme.id}-${key.replace('--','')}" value="${value}" data-theme-id="${theme.id}" data-color-var="${key}" class="color-text-input">
                </div>`;
            }).join('');

            themeEditorHTML = `
                <div class="theme-card" data-theme-id="${theme.id}">
                    <div class="theme-header ${theme.is_active ? 'active-theme' : ''}">
                        <label for="theme-name-${theme.id}">Название темы:</label>
                        <input type="text" id="theme-name-${theme.id}" class="theme-name-input" value="${theme.name}" placeholder="Название темы" style="font-size: 1.1em; width: 60%; font-weight: normal;">
                    </div>
                    <h3>Редактирование цветов:</h3>
                    <div class="theme-colors-grid">${colorsHTML}</div>
                    <div class="theme-actions">
                        <button class="button small" onclick="app.updateTheme('${theme.id}')">💾 Сохранить</button>
                        <button class="button secondary small" onclick="app.activateTheme('${theme.id}')" ${theme.is_active ? 'disabled' : ''}>🚀 Сделать глобальной</button>
                        <button class="button small" style="background: var(--danger-color); margin-left: auto;" onclick="app.deleteTheme('${theme.id}')">🗑️ Удалить</button>
                    </div>
                </div>
            `;
        }

        // 3. Собираем финальный HTML
        adminThemeEditorHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="button" onclick="app.addNewTheme()">+ Добавить новую тему</button>
            </div>
            <p style="text-align: center; margin-bottom: 20px; font-style: italic;">Изменяй цвета в реальном времени. Не забудь нажать "Сохранить" для каждой измененной темы!</p>
            
            <div class="theme-selector-panel">${themeSelectorButtons}</div>
            
            <div class="themes-container">${themeEditorHTML || '<h2>Выберите тему для редактирования</h2>'}</div>
         `;
    } else if (state.themeEditorLoaded && state.themes.length === 0) {
        adminThemeEditorHTML = `
            <h2 style="margin-top: 50px;">Темы не найдены.</h2>
            <div style="text-align: center; margin-bottom: 20px;">
                <button class="button" onclick="app.addNewTheme()">+ Добавить новую тему</button>
            </div>`;
    } else {
        adminThemeEditorHTML = `<h2>Загрузка редактора тем...</h2>`;
    }
    return adminThemeEditorHTML;
}