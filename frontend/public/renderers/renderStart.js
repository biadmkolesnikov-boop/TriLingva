// frontend/public/renderers/renderStart.js
// --- ИЗМЕНЕНИЕ (v23.2): Исправлен формат комментария ---
// --- ИЗМЕНЕНИЕ (v23.x): Добавлен onclick на логотип ---

export function renderStart(appInstance, state) {
    // Рендерит стартовый экран приложения

    const isAdmin = appInstance.isAdmin();
    const userEmail = state.user?.email || 'Пользователь';
    const resetRequestsCount = state.admin?.resetRequestsCount || 0;

    // Иконка уведомлений для админа
    const adminNotificationIcon = isAdmin && resetRequestsCount > 0
        ? `<span class="admin-notification-icon" onclick="app.navigateToUserSettings('users')" title="Запросы на сброс пароля">✉️ ${resetRequestsCount}</span>`
        : '';

    // Иконка профиля для всех
    const profileIcon = `<span class="profile-icon" onclick="app.navigateToUserSettings('profile')" title="Настройки профиля">⚙️</span>`;

    // Кнопки для админа
    const adminButtons = isAdmin ? `
        <button class="button secondary" onclick="app.navigateTo('dictionaryEditor')">Редактор словарей</button>
        <button class="button secondary" onclick="app.navigateTo('storyEditor')">Редактор историй</button>
        ` : '';

    return `<div class="start-screen-container">
        <div class="user-info">
            Пользователь: <strong>${userEmail}</strong>
            ${profileIcon}
            ${adminNotificationIcon}
        </div>
        <div class="logo" onclick="app.navigateTo('about')" title="О проекте">🧠</div> <!-- Добавлен onclick и title -->
        <h1>Контекстный тренажёр</h1>
        <button class="button" onclick="app.navigateTo('profileSelection')">Начать обучение</button>
        <button class="button secondary" onclick="app.navigateToUserSettings()">Настройки</button>
        ${adminButtons}
        <!-- --- ИЗМЕНЕНИЕ: Текст кнопки и формат комментария --- -->
        <button class="button secondary" onclick="app.navigateTo('about')">О проекте</button>
        <!-- --- КОНЕЦ ИЗМЕНЕНИЯ --- -->
        <button class="button" style="background: var(--danger-color);" onclick="app.logout()">Выйти</button>
    </div>`;
}
