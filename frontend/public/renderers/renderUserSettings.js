// frontend/public/renderers/renderUserSettings.js
// (Этот файл содержит основную функцию рендеринга для экрана настроек и использует другие рендеры для вкладок)

// --- Импорт рендеров для вкладок ---
import { renderGeneralSettings } from './settings/renderGeneralSettings.js';
import { renderThemeAndFontSettings } from './settings/renderThemeAndFontSettings.js';
import { renderAdminThemeEditor } from './settings/renderAdminThemeEditor.js';
import { renderEasterEggsSettings } from './settings/renderEasterEggsSettings.js';
import { renderUserProfileSettings } from './settings/renderUserProfileSettings.js';
import { renderAdminUsers } from './settings/renderAdminUsers.js';
// ------------------------------------

export function renderUserSettings(appInstance, state) {
    const s = state.settings || {};
    const activeTab = state.settingsActiveTab || 'general'; // Default to 'general'
    const isAdmin = appInstance.isAdmin();

    // --- Сборка всех кнопок вкладок ---
    const profileButton = `<button class="button ${activeTab === 'profile' ? '' : 'secondary'}" onclick="app.setSettingsTab('profile')">👤 Профиль</button>`;
    const adminThemeButton = isAdmin ? `<button class="button ${activeTab === 'admin_theme' ? '' : 'secondary'}" onclick="app.setSettingsTab('admin_theme')">👑 Редактор тем</button>` : '';
    const easterEggsButton = isAdmin ? `<button class="button ${activeTab === 'easter_eggs' ? '' : 'secondary'}" onclick="app.setSettingsTab('easter_eggs')">🥚 Пасхалки</button>` : '';
    const adminUsersButton = isAdmin ? `<button class="button ${activeTab === 'users' ? '' : 'secondary'}" onclick="app.setSettingsTab('users')">👥 Пользователи</button>` : '';


    const tabsHTML = `
        <div class="settings-tabs">
            <button class="button ${activeTab === 'general' ? '' : 'secondary'}" onclick="app.setSettingsTab('general')">Общие</button>
            ${profileButton}
            <button class="button ${activeTab === 'theme' ? '' : 'secondary'}" onclick="app.setSettingsTab('theme')">Тема и Шрифты</button>
            ${adminThemeButton}
            ${easterEggsButton}
            ${adminUsersButton}
        </div>
    `;

    // --- Сборка всего контента вкладок в обертку ---
    let allTabsContent = `
        <div id="general-tab-content" class="tab-content ${activeTab === 'general' ? 'active' : ''}">
            ${renderGeneralSettings(s, appInstance)}
        </div>
        <div id="profile-tab-content" class="tab-content ${activeTab === 'profile' ? 'active' : ''}">
            ${renderUserProfileSettings(state.user, appInstance)}
        </div>
        <div id="theme-tab-content" class="tab-content ${activeTab === 'theme' ? 'active' : ''}">
            ${renderThemeAndFontSettings(s, state, appInstance)}
        </div>
    `;

    if (isAdmin) {
        allTabsContent += `
            <div id="admin-theme-tab-content" class="tab-content ${activeTab === 'admin_theme' ? 'active' : ''}">
                ${renderAdminThemeEditor(state, appInstance)}
            </div>
            <div id="easter-eggs-tab-content" class="tab-content ${activeTab === 'easter_eggs' ? 'active' : ''}">
                ${renderEasterEggsSettings(s, appInstance)}
            </div>
            <div id="admin-users-tab-content" class="tab-content ${activeTab === 'users' ? 'active' : ''}">
                ${renderAdminUsers(state.admin?.users || [], appInstance)}
            </div>
        `;
    }

    // --- Финальный HTML ---
    return `<h1>Настройки</h1>
             ${tabsHTML}
             <div class="card-training settings-container">
                 <div class="tab-content-wrapper">
                     ${allTabsContent}
                 </div>
             </div>
             <div style="max-width: 500px; margin: 20px auto 0 auto;">
                 <button class="button" onclick="app.navigateTo('start')">На главный экран</button>
             </div>`;
}
