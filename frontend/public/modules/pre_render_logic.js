// frontend/public/modules/pre_render_logic.js
// Этот модуль содержит логику, которая должна выполняться
// в методе render() ПЕРЕД генерацией HTML-контента.
// Сюда входит сохранение прокрутки, проверка авторизации,
// управление классами body и контейнера.

/**
 * Выполняет подготовительные действия перед рендерингом.
 * @param {App} appInstance - Экземпляр App.
 * @returns {string} - Актуальное имя экрана (screen), которое будет отрисовано.
 */
export function applyPreRenderEffects(appInstance) {
    
    // 1. Сохранение прокрутки Настроек (если мы уже на этом экране)
    const scrollWrapperBefore = document.querySelector('.tab-content-wrapper');
    if (appInstance.state.screen === 'userSettings' && scrollWrapperBefore) {
        appInstance.settingsScrollPosition = scrollWrapperBefore.scrollTop;
    }

    // 2. Сброс обработчиков клавиш и счетчиков
    document.onkeydown = null;
    document.body.onkeypress = null;
    if (appInstance.enterConfirmTimeout) {
        clearTimeout(appInstance.enterConfirmTimeout);
        appInstance.enterConfirmTimeout = null;
    }
    appInstance.enterPressCount = 0;

    // 3. Проверка авторизации и определение экрана для рендеринга
    let screen = appInstance.state.screen;
    const publicScreens = ['login', 'about'];
    
    if (!appInstance.state.token && !publicScreens.includes(screen)) {
        // Если нет токена и экран не публичный, принудительно ставим 'login'
        console.warn(`Доступ к '${screen}' запрещен без токена. Перенаправление на 'login'.`);
        screen = 'login'; 
        appInstance.state.screen = 'login'; // Обновляем state
        sessionStorage.setItem('lastScreen', 'login');
    }

    // 4. Управление классом 'on-login-screen'
    document.body.classList.toggle('on-login-screen', !appInstance.state.token && (screen === 'login' || screen === 'about'));

    // 5. Управление "Матрицей" (futuristicView)
    const showFuturistic = appInstance.getSetting('futuristicView');
    const isFuturisticActive = document.body.classList.contains('futuristic-view');
    if (showFuturistic && !isFuturisticActive) {
        appInstance.initMatrix();
    } else if (!showFuturistic && isFuturisticActive) {
        appInstance.stopMatrix(); // stopMatrix() сам уберет класс, если нужно
    }

    // 6. Управление 'wide-mode' для контейнера
    const appContainer = document.getElementById('app');
    const wideModeTabs = ['users', 'admin_theme'];
    if (appContainer) {
        appContainer.classList.toggle('wide-mode', 
            screen === 'userSettings' && wideModeTabs.includes(appInstance.state.settingsActiveTab)
        );
    }
    
    // 7. Возвращаем экран, который в итоге будет отрисован
    return screen; 
}
