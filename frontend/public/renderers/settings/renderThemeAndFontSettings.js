// frontend/public/renderers/settings/renderThemeAndFontSettings.js (ПОЛНЫЙ ОБНОВЛЁННЫЙ КОД v20.13)
// --- ИЗМЕНЕНИЕ: Фикс сравнения шрифта Segoe UI ---

export function renderThemeAndFontSettings(s, state, appInstance) {
    let themeSettingsHTML = '<h2>Загрузка тем...</h2>';
    if (state.themeEditorLoaded) {
        const selectedThemeId = state.user?.selected_theme_id;
        const themeOptions = state.themes
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(theme =>
                `<option value="${theme.id}" ${selectedThemeId === theme.id ? 'selected' : ''}>${theme.name}</option>`
            ).join('');

        // <<< --- ФИКС СРАВНЕНИЯ ШРИФТА --- >>>
        // Точное значение по умолчанию
        const defaultFontFamilyValue = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        // <<< --- КОНЕЦ ФИКСА --- >>>

        themeSettingsHTML = `
            <div class="setting-row">
                <label for="theme-select">Выберите тему оформления:</label>
                <select id="theme-select" onchange="app.setUserTheme(this.value)">
                    <option value="null" ${selectedThemeId === null ? 'selected' : ''}>Сбросить (Тема по умолчанию)</option>
                    ${themeOptions}
                </select>
            </div>
            <hr style="width: 100%; margin: 20px 0;">
            <h3>Шрифты (Глобально)</h3>
            <p style="font-size: 0.9em; opacity: 0.7; text-align: center; margin-bottom: 15px;">Эти настройки сохраняются в браузере и применяются ко всему приложению.</p>
            <div class="setting-row">
                <label for="font-family-select">Шрифт:</label>
                <select id="font-family-select" onchange="app.setUserSetting('globalFontFamily', this.value)">
                    {/* <<< --- ФИКС СРАВНЕНИЯ ШРИФТА --- >>> */}
                    <option value="${defaultFontFamilyValue}" ${s.globalFontFamily === defaultFontFamilyValue ? 'selected' : ''}>Стандартный (Segoe UI)</option>
                    {/* <<< --- КОНЕЦ ФИКСА --- >>> */}
                    <option value="Arial, sans-serif" ${s.globalFontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                    <option value="'Times New Roman', serif" ${s.globalFontFamily === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
                    <option value="'Courier New', monospace" ${s.globalFontFamily === "'Courier New', monospace" ? 'selected' : ''}>Courier New (Моноширинный)</option>
                    <option value="'Comic Sans MS', cursive" ${s.globalFontFamily === "'Comic Sans MS', cursive" ? 'selected' : ''}>Comic Sans MS</option>
                    <option value="Georgia, serif" ${s.globalFontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
                    <option value="Verdana, sans-serif" ${s.globalFontFamily === 'Verdana, sans-serif' ? 'selected' : ''}>Verdana</option>
                </select>
            </div>
            <div class="setting-row">
                <label for="font-size-slider">Размер шрифта: (${s.globalFontSize})</label>
                <input type="range" id="font-size-slider" min="14" max="22" step="1"
                       value="${parseInt(s.globalFontSize, 10)}"
                       oninput="this.previousElementSibling.textContent = 'Размер шрифта: (' + this.value + 'px)'; app.setUserSetting('globalFontSize', this.value + 'px')">
            </div>
        `;
    }
    return themeSettingsHTML;
}
