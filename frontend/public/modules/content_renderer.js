// frontend/public/modules/content_renderer.js
// Этот модуль отвечает за основную логику выбора
// и вызова нужной функции-рендерера для текущего экрана.

// Импорты всех рендереров, которые нам понадобятся
import {
    renderLogin, renderStart, renderProfileSelection,
    renderProfileDashboard, renderUserSettings, renderWordSelection,
    renderTraining, renderStage2, renderStage3, renderCompletion,
    renderGlobalCompletion, renderAbout, renderDictionaryEditor,
    renderStoryEditor
} from '../renderer.js';

/**
 * Генерирует HTML-контент для текущего экрана приложения.
 * @param {App} appInstance - Экземпляр App.
 * @returns {string} - Сгенерированный HTML-код.
 */
export function renderAppContent(appInstance) {
    const state = appInstance.state;
    let screen = state.screen; // Берем текущий экран из state
    let content = '';

    // --- (Логика аутентификации остается в main.js) ---
    // Здесь мы доверяем, что screen уже корректный
    
    try {
        const profile = appInstance.getActiveProfile();
        // Сессия для текущего языка (может быть null)
        const session = profile?.sessions?.[profile?.language];

        // --- Основной роутинг рендеринга ---
        if (screen === 'login') {
            content = renderLogin(appInstance, state);
        }
        else if (screen === 'start') {
            content = renderStart(appInstance, state);
        }
        else if (screen === 'profileSelection') {
            content = renderProfileSelection(appInstance, state);
        }
        else if (screen === 'userSettings') {
            content = renderUserSettings(appInstance, state);
        }
        else if (screen === 'about') {
            content = renderAbout(appInstance, state);
        }
        else if (screen === 'dictionaryEditor') {
            content = renderDictionaryEditor(appInstance, state);
        }
        else if (screen === 'storyEditor') {
            content = renderStoryEditor(appInstance, state);
        }
        else if (screen === 'globalCompletion') {
            content = renderGlobalCompletion(appInstance, state);
        }
        else if (screen === 'completion') {
            content = renderCompletion(appInstance, state);
        }
        else if (screen === 'profileDashboard') {
             console.log("Rendering profileDashboard.");
             content = renderProfileDashboard(appInstance, state);
        }
        else { 
            // --- Экраны, требующие активного профиля ---
            if (!profile) {
                // Если мы попали сюда без профиля (например, при перезагрузке)
                console.warn("Profile screen requested without active profile, redirecting to selection");
                // Немедленно меняем state и рендерим экран выбора
                appInstance.state.screen = 'profileSelection';
                sessionStorage.setItem('lastScreen', 'profileSelection');
                content = renderProfileSelection(appInstance, state);
            } 
            else if (session) {
                // Если профиль есть И есть активная сессия для этого языка
                const sessionScreen = session.screen;
                console.log("Rendering active session screen:", sessionScreen);
                switch(sessionScreen) {
                    case 'wordSelection': content = renderWordSelection(appInstance, state); break;
                    case 'training': content = renderTraining(appInstance, state); break;
                    case 'stage2': content = renderStage2(appInstance, state); break;
                    case 'stage3': content = renderStage3(appInstance, state); break;
                    default:
                         // Неизвестный экран в сессии, сбрасываем сессию
                         console.warn("Unknown session screen in state, defaulting to dashboard:", sessionScreen);
                         profile.sessions[profile.language] = null;
                         appInstance.clearActiveSessionsFromLocalStorage();
                         appInstance.saveCurrentProfileProgress(); // Сохраняем сброс
                         appInstance.state.screen = 'profileDashboard';
                         sessionStorage.setItem('lastScreen', 'profileDashboard');
                         content = renderProfileDashboard(appInstance, state);
                }
            } 
            else {
                // Профиль есть, но сессии для этого языка нет
                console.log("Profile active, but no session for language", profile.language, "- Rendering dashboard.");
                appInstance.state.screen = 'profileDashboard';
                sessionStorage.setItem('lastScreen', 'profileDashboard');
                content = renderProfileDashboard(appInstance, state);
            }
        }
    } catch (error) {
         // --- Обработка ошибок рендеринга ---
         console.error("Error during content rendering:", error);
         content = `<h1>Ошибка рендеринга</h1><p>${error.message}</p><pre>${error.stack}</pre><button onclick="window.location.reload()">Перезагрузить</button>`;
    }

    return content;
}
