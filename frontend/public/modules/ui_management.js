// frontend/public/modules/ui_management.js
// Этот модуль содержит логику, связанную с управлением навигацией,
// состоянием UI и временными настройками.

/**
 * Устанавливает активную вкладку настроек, сохраняя позицию прокрутки.
 * @param {App} appInstance
 * @param {string} tabName
 */
export function setSettingsTab(appInstance, tabName) {
    appInstance.playSoundClick();
    // Сохраняем прокрутку ПЕРЕД сменой вкладки
    const scrollWrapper = document.querySelector('.tab-content-wrapper');
    appInstance.settingsScrollPosition = scrollWrapper ? scrollWrapper.scrollTop : 0;

    appInstance.state.settingsActiveTab = tabName;
    sessionStorage.setItem('settingsActiveTab', tabName);

    // Запускаем загрузку данных, если это вкладка темы или пользователи
    if ( (tabName === 'theme' || tabName === 'admin_theme') && !appInstance.state.themeEditorLoaded) {
         appInstance.loadAllThemes(); // Загружаем темы
    } else if (tabName === 'users' && appInstance.isAdmin() && appInstance.state.admin.users.length === 0 && !appInstance.state.admin.isLoadingUsers) {
         appInstance.loadAdminUsers(); // Загружаем пользователей
    } else {
         appInstance.render(); // Просто перерисовываем
    }
}

/**
 * Устанавливает параметр состояния активной сессии (например, активную вкладку выбора слов).
 * @param {App} appInstance
 * @param {string} key
 * @param {*} value
 */
export function setSessionState(appInstance, key, value) {
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return;
    s[key] = value;
    appInstance.saveActiveSessionsToLocalStorage();

    if (key === 'selectionTab' && s.screen === 'wordSelection') {
         appInstance.render();
    }
}

/**
 * Переключает состояние автоперехода в активной сессии.
 * @param {App} appInstance
 */
export function toggleAutoAdvance(appInstance) {
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return;
    s.autoAdvance = !s.autoAdvance;
    appInstance.saveActiveSessionsToLocalStorage();
    // Ререндер не требуется, т.к. только обновляется чекбокс
}

/**
 * Переключает язык активного профиля на дашборде.
 * @param {App} appInstance
 * @param {string} lang
 */
export function changeLanguage(appInstance, lang) {
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    profile.language = lang;
    sessionStorage.setItem('dashboardLanguage', lang);
    appInstance.loadActiveSessionsFromLocalStorage(); // Загружаем сессию для нового языка (или null)
    appInstance.render();
}

/**
 * Переходит на экран настроек, восстанавливая или устанавливая активную вкладку.
 * @param {App} appInstance
 * @param {string|null} targetTab
 */
export async function navigateToUserSettings(appInstance, targetTab = null) {
    if (targetTab) {
        appInstance.state.settingsActiveTab = targetTab;
        sessionStorage.setItem('settingsActiveTab', targetTab);
    } else {
         appInstance.state.settingsActiveTab = sessionStorage.getItem('settingsActiveTab') || 'general';
    }

    // Загрузка данных, если необходимо (для вкладок Тема и Пользователи)
    if ((appInstance.state.settingsActiveTab === 'theme' || appInstance.state.settingsActiveTab === 'admin_theme') && !appInstance.state.themeEditorLoaded) {
         await appInstance.loadAllThemes();
    } else if (appInstance.state.settingsActiveTab === 'users' && appInstance.isAdmin() && appInstance.state.admin.users.length === 0 && !appInstance.state.admin.isLoadingUsers) {
         await appInstance.loadAdminUsers();
    }

    appInstance.navigateTo('userSettings');
}

/**
 * Добавляет обработчики событий для предпросмотра цветов в редакторе тем.
 * @param {App} appInstance
 */
export function attachThemePreviewHandlers(appInstance) {
    const themesContainer = document.querySelector('.themes-container');
    if (!themesContainer) return;
    
    // Вспомогательная функция для пересоздания элементов и чистого привязывания слушателей
    const setupListener = (elements, eventType, handler) => {
        elements.forEach(el => {
            const clone = el.cloneNode(true);
            // Удаляем старые слушатели, привязывая нового клон-элемента
            clone.addEventListener(eventType, handler);
            el.parentNode.replaceChild(clone, el);
        });
    };
    
    // Обработчик для input[type="color"]
    setupListener(themesContainer.querySelectorAll('.color-picker-input'), 'input', (event) => {
        const newValue = event.target.value; 
        const colorVar = event.target.dataset.colorVar;
        const textInput = event.target.nextElementSibling;
        if (textInput?.classList.contains('color-text-input')) textInput.value = newValue;
        appInstance.applyThemePreview(colorVar, newValue);
    });
    
    // Обработчик для input[type="text"]
    setupListener(themesContainer.querySelectorAll('.color-text-input'), 'input', (event) => {
        const newValue = event.target.value; 
        const colorVar = event.target.dataset.colorVar;
        const colorPicker = event.target.previousElementSibling;
        try { 
            if (colorPicker?.classList.contains('color-picker-input')) colorPicker.value = newValue; 
        } catch (ex) {} // Ловим ошибку, если введен невалидный цвет для type="color"
        appInstance.applyThemePreview(colorVar, newValue);
    });
}
