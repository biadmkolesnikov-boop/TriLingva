// frontend/public/renderers/settings/renderUserProfileSettings.js

export function renderUserProfileSettings(user, appInstance) {
    if (!user) {
        return '<h2>Загрузка профиля...</h2>';
    }

    // Готовим опции для года рождения
    const currentYear = new Date().getFullYear();
    let yearOptions = '';
    for (let year = currentYear; year >= 1920; year--) {
        yearOptions += `<option value="${year}" ${user.year_of_birth === year ? 'selected' : ''}>${year}</option>`;
    }

    return `
        <h2>Настройки Профиля</h2>
        <div class="setting-row">
            <label>Email:</label>
            <input type="email" value="${user.email || ''}" disabled readonly>
        </div>
        <div class="setting-row">
            <label for="profile-display-name">Имя Фамилия:</label>
            <input type="text" id="profile-display-name" value="${user.display_name || ''}">
        </div>
        <div class="setting-row">
            <label for="profile-nickname">Никнейм:</label>
            <input type="text" id="profile-nickname" value="${user.nickname || ''}">
        </div>
        <div class="setting-row">
            <label for="profile-year-of-birth">Год рождения:</label>
            <select id="profile-year-of-birth">${yearOptions}</select>
        </div>
        <div class="setting-row">
            <label for="profile-avatar-emoji">Аватар (смайлик):</label>
            <input type="text" id="profile-avatar-emoji" value="${user.avatar_emoji || '🤪'}" maxlength="2">
        </div>
        <div class="setting-row" style="align-items: flex-start;">
            <label for="profile-about-me">О себе:</label>
            <textarea id="profile-about-me" class="profile-textarea">${user.about_me || ''}</textarea>
        </div>
        <div class="setting-row button-group" style="justify-content: flex-end;">
             <button class="button small" onclick="app.saveProfile()">Сохранить профиль</button>
        </div>

        <hr style="width: 100%; margin: 25px 0;">
        <h3>Смена пароля</h3>
        <div class="setting-row">
            <label for="profile-old-password">Старый пароль:</label>
            <input type="password" id="profile-old-password" autocomplete="current-password">
        </div>
        <div class="setting-row">
            <label for="profile-new-password">Новый пароль (мин. 6):</label>
            <input type="password" id="profile-new-password" autocomplete="new-password">
        </div>
        <div class="setting-row">
            <label for="profile-confirm-password">Повторите новый пароль:</label>
            <input type="password" id="profile-confirm-password" autocomplete="new-password">
        </div>
        <div class="setting-row button-group" style="justify-content: flex-end;">
             <button class="button small" onclick="app.changePassword()">Сменить пароль</button>
        </div>

         <hr style="width: 100%; margin: 25px 0;">
        <h3>Сброс пароля</h3>
         <p style="font-size: 0.9em; opacity: 0.7; text-align: center; margin-bottom: 15px;">Если вы забыли пароль, вы можете запросить сброс. Администратор получит уведомление.</p>
        <div class="setting-row button-group" style="justify-content: center;">
            <button class="button small secondary" onclick="app.requestPasswordReset()">Запросить сброс пароля</button>
        </div>
    `;
}
