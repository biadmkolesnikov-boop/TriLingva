// frontend/public/modules/theme.js

import {
    getActiveThemeApi, setUserThemeApi,
    getAllThemesApi, addThemeApi, updateThemeApi,
    deleteThemeApi, activateThemeApi
} from '../api.js';

/**
 * Загружает активную тему с сервера и применяет ее к DOM.
 * Это используется при первой загрузке или для отката.
 * @param {App} appInstance
 */
export async function applyThemeFromServer(appInstance) {
    console.log("Applying theme from server...");
    try {
        //
        const theme = await getActiveThemeApi(appInstance.state.token);
        if (!theme || !theme.id || typeof theme.colors !== 'object' || theme.colors === null) {
             console.warn("No valid theme found on server, applying default UI styles.");
             document.body.className = '';
             return;
        }
        console.log("Applying theme:", theme.name, theme.id);
        document.body.className = theme.id;
        const root = document.documentElement;
        const colors = theme.colors;
        for (const colorName in colors) {
            //
            if (colorName.startsWith('--') && typeof colors[colorName] === 'string') {
                root.style.setProperty(colorName, colors[colorName]);
            }
        }
    } catch (error) {
        console.error('Не удалось загрузить или применить тему с сервера:', error);
        document.body.className = 'theme-newspaper';
         const defaultColors = { "--bg-grad-start": "#d7c29e", "--bg-grad-end": "#b9a178", "--accent-color": "#5d4037", "--accent-hover": "#4e342e", "--text-color": "#3e2723", "--bg-color": "#fdf5e6", "--paper-color": "#faf3e0", "--success-color": "#4CAF50", "--danger-color": "#f44336", "--gold-color": "#FFD700" };
         const root = document.documentElement;
         for (const colorName in defaultColors) { root.style.setProperty(colorName, defaultColors[colorName]); }
    }
}

/**
 * Загружает все темы для редактора (только для админа)
 * @param {App} appInstance
 */
export async function loadAllThemes(appInstance) {
    if (!appInstance.state.token) return;
    console.log("Starting to load all themes...");
    appInstance.state.themeEditorLoaded = false;
    if (appInstance.state.screen === 'userSettings') { appInstance.render(); }

    try {
        appInstance.state.themes = await getAllThemesApi(appInstance.state.token);
        appInstance.state.themeEditorLoaded = true;
        console.log("Themes loaded successfully.");
        if (appInstance.state.screen === 'userSettings') {
             console.log("Rendering settings screen with loaded themes.");
             appInstance.render();
        }
    } catch (error) {
        console.error('Ошибка загрузки тем:', error);
         if (appInstance.state.screen === 'userSettings') {
             alert(`Не удалось загрузить темы. Причина: ${error.message}\nПопробуйте обновить страницу.`);
             appInstance.render();
         }
    }
}

/**
 * Применяет предварительный просмотр цвета.
 * @param {string} colorVar
 * @param {string} value
 */
export function applyThemePreview(colorVar, value) {
    document.documentElement.style.setProperty(colorVar, value);
}

/**
 * ПРИМЕНЯЕТ СТИЛИ ТЕМЫ НАПРЯМУЮ ИЗ ЛОКАЛЬНОГО СОСТОЯНИЯ.
 * @param {App} appInstance
 * @param {object|null} theme - Объект темы, включая {id, colors} или null для сброса
 */
function applyLocalTheme(appInstance, theme) {
     const root = document.documentElement;
     const defaultColors = { "--bg-grad-start": "#d7c29e", "--bg-grad-end": "#b9a178", "--accent-color": "#5d4037", "--accent-hover": "#4e342e", "--text-color": "#3e2723", "--bg-color": "#fdf5e6", "--paper-color": "#faf3e0", "--success-color": "#4CAF50", "--danger-color": "#f44336", "--gold-color": "#FFD700" };

     if (!theme || !theme.id || typeof theme.colors !== 'object' || theme.colors === null) {
         console.warn("Applying default theme ('theme-newspaper').");
         document.body.className = 'theme-newspaper';
         // Применяем дефолтные цвета, чтобы они перекрыли любые старые стили
         for (const colorName in defaultColors) { root.style.setProperty(colorName, defaultColors[colorName]); }
         return;
    }

    console.log("Applying theme locally:", theme.name, theme.id);
    document.body.className = theme.id;
    const colors = theme.colors;
    for (const colorName in colors) {
         if (colorName.startsWith('--') && typeof colors[colorName] === 'string') {
             root.style.setProperty(colorName, colors[colorName]);
         }
    }
}


/**
 * Сохраняет изменения в существующей теме (только для админа).
 * @param {App} appInstance
 * @param {string} themeId
 */
export async function updateTheme(appInstance, themeId) {
    const themeCard = document.querySelector(`.theme-card[data-theme-id="${themeId}"]`);
    if (!themeCard) return;
    const nameInput = themeCard.querySelector('.theme-name-input');
    const name = nameInput ? nameInput.value.trim() : 'Без имени';
    if (!name) { return alert("Название темы не может быть пустым."); }
    const colorInputs = themeCard.querySelectorAll('.color-input-group input[type="text"]');
    const colors = {};
    colorInputs.forEach(input => {
        const key = input.dataset.colorVar;
        if (key) { colors[key] = input.value; }
    });
    if (Object.keys(colors).length === 0) { return alert("Не найдено цветов для сохранения."); }

    try {
        appInstance.playSoundClick();
        const updatedTheme = await updateThemeApi(appInstance.state.token, themeId, { name, colors });
        alert(`Тема "${name}" успешно сохранена!`);
        const themeIndex = appInstance.state.themes.findIndex(t => t.id === themeId);
        if(themeIndex !== -1) {
            appInstance.state.themes[themeIndex] = updatedTheme;
        }
    } catch (error) {
        alert(`Ошибка при сохранении темы: ${error.message}`);
    }
}

/**
 * Активирует тему как глобальную (только для админа).
 * @param {App} appInstance
 * @param {string} themeId
 */
export async function activateTheme(appInstance, themeId) {
    if (!confirm('Вы уверены, что хотите сделать эту тему активной для всех пользователей?')) return;
    try {
        appInstance.playSoundClick();
        await activateThemeApi(appInstance.state.token, themeId);
        alert('Тема успешно активирована!');
        // Обновляем локальное состояние, чтобы применить новый активный флаг и обновить UI
        appInstance.state.themes.forEach(theme => { theme.is_active = (theme.id === themeId); });
        // Применяем новую глобальную тему немедленно
        await applyThemeFromServer(appInstance);
        appInstance.render();
    } catch (error) {
        alert(`Ошибка при активации темы: ${error.message}`);
    }
}

/**
 * Добавляет новую тему с дефолтными цветами (только для админа).
 * @param {App} appInstance
 */
export async function addNewTheme(appInstance) {
    const name = prompt("Введите название новой темы:", "Новая тема")?.trim();
    if (!name) return;
    const defaultColors = { "--bg-grad-start": "#b0bec5", "--bg-grad-end": "#90a4ae", "--accent-color": "#455a64", "--accent-hover": "#37474f", "--text-color": "#263238", "--bg-color": "#eceff1", "--paper-color": "#cfd8dc", "--success-color": "#4CAF50", "--danger-color": "#f44336", "--gold-color": "#FFD700" };
    try {
        appInstance.playSoundClick();
        const newTheme = await addThemeApi(appInstance.state.token, { name, colors: defaultColors });
        appInstance.state.themes.push(newTheme);
        appInstance.state.themes.sort((a, b) => a.name.localeCompare(b.name));
        appInstance.render();
    } catch (error) {
        alert(`Ошибка при добавлении темы: ${error.message}`);
    }
}

/**
 * Удаляет тему (только для админа).
 * @param {App} appInstance
 * @param {string} themeId
 */
export async function deleteTheme(appInstance, themeId) {
    const theme = appInstance.state.themes.find(t => t.id === themeId);
    const themeName = theme?.name || 'эту тему';
     if (theme?.is_active) {
          alert('Нельзя удалить глобально активную тему. Сначала активируйте другую.');
          return;
     }
    if (!confirm(`Вы уверены, что хотите удалить "${themeName}"? Это действие необратимо.`)) return;
    try {
        appInstance.playSoundClick();
        await deleteThemeApi(appInstance.state.token, themeId);
        appInstance.state.themes = appInstance.state.themes.filter(t => t.id !== themeId);
        if (appInstance.state.user && appInstance.state.user.selected_theme_id === themeId) {
            // Если удалили выбранную пользователем тему, сбрасываем выбор
            await setUserTheme(appInstance, null); // setUserTheme вызовет render
        } else {
             appInstance.render();
        }
         alert(`Тема "${themeName}" удалена.`);
    } catch (error) {
        alert(`Ошибка при удалении темы: ${error.message}`);
    }
}

/**
 * Устанавливает персональную тему пользователя.
 * @param {App} appInstance
 * @param {string|null} themeId
 */
export async function setUserTheme(appInstance, themeId) {
    appInstance.playSoundClick();
    const newThemeId = (themeId === 'null' || themeId === null) ? null : themeId;
    const oldThemeId = appInstance.state.user?.selected_theme_id;

    // 1. Находим объект темы, которую нужно применить.
    let themeToApply = null;
    if (newThemeId) {
        // Выбрана конкретная тема: ищем ее в локальном списке
        themeToApply = appInstance.state.themes.find(t => t.id === newThemeId);
    } else {
        // Сброс (null): ищем глобально активную тему
        themeToApply = appInstance.state.themes.find(t => t.is_active) || null;
        // Если нет активной темы, останется null, что приведет к дефолту
    }

    try {
         // 2. Обновляем state пользователя
         if (appInstance.state.user) {
             appInstance.state.user.selected_theme_id = newThemeId;
         }

         // 3. ПРИМЕНЯЕМ ТЕМУ НАПРЯМУЮ ИЗ ЛОКАЛЬНОГО СОСТОЯНИЯ
         applyLocalTheme(appInstance, themeToApply);

         // 4. Перерисовываем UI, чтобы селект выглядел корректно
         // Это важно, чтобы атрибут 'selected' на опции обновился
         if (appInstance.state.screen === 'userSettings' && appInstance.state.settingsActiveTab === 'theme') {
              appInstance.render();
         }

         // 5. Сохраняем ID темы на сервере
        await setUserThemeApi(appInstance.state.token, newThemeId);
        console.log("User theme saved successfully.");

    } catch (error) {
         console.error(`Ошибка при смене темы: ${error.message}`);
         alert(`Ошибка при смене темы: ${error.message}`);
         // Откат в случае ошибки сохранения
         if (appInstance.state.user) {
             appInstance.state.user.selected_theme_id = oldThemeId;
         }
         // ПОВТОРНОЕ применение темы с сервера для отката
         await applyThemeFromServer(appInstance);
         if (appInstance.state.screen === 'userSettings' && appInstance.state.settingsActiveTab === 'theme') {
              appInstance.render();
         }
    }
}
