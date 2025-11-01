// frontend/public/renderers/renderLogin.js
// --- ИЗМЕНЕНИЕ: Добавлена ссылка "О проекте", стилизована под кнопку, убран неверный комментарий ---
// --- ИЗМЕНЕНИЕ (v23.x): Добавлен onclick на логотип ---
// --- ИЗМЕНЕНИЕ (v23.x+1): Убрана кнопка "О проекте" со страницы входа ---

export function renderLogin(appInstance, state) {
    // Рендерит экран входа
    // Генерируем опции для года рождения
    const currentYear = new Date().getFullYear();
    let yearOptions = '';
    for (let year = currentYear; year >= 1920; year--) {
        yearOptions += `<option value="${year}">${year}</option>`;
    }

    // --- Кнопка "О проекте" удалена ---
    // const aboutProjectLink = `...`;

    return `<div class="auth-container">
        <div class="logo" onclick="app.navigateTo('about')" title="О проекте">🧠</div> <!-- Добавлен onclick и title -->
        <h1>Вход</h1>
        <input id="login-email" type="email" placeholder="Email" autocomplete="email">
        <input id="login-password" type="password" placeholder="Пароль" autocomplete="current-password">
        <button class="button" onclick="app.login()">Войти</button>
        <hr style="width: 80%; margin: 20px 0;">
        <h1>Регистрация</h1>
        <input id="register-email" type="email" placeholder="* Email" autocomplete="email" required>
        <input id="register-password" type="password" placeholder="* Пароль (мин. 6 симв.)" autocomplete="new-password" required>
        <input id="register-display-name" type="text" placeholder="* Имя Фамилия (мин. 2 симв.)" autocomplete="name" required>
        <select id="register-year-of-birth" required>
            <option value="" disabled selected>* Год рождения</option>
            ${yearOptions}
        </select>
        <input id="register-nickname" type="text" placeholder="Никнейм (если пусто - сгенерируется)" autocomplete="nickname">
        <input id="register-avatar-emoji" type="text" placeholder="Аватар (один смайлик, по умолч. 🤪)" maxlength="2">
        <textarea id="register-about-me" placeholder="О себе..." style="width: 100%; min-height: 60px; padding: 10px; font-size: 1em; border-radius: 8px; border: 2px solid var(--accent-color); margin-bottom: 10px; background: var(--paper-color); color: var(--text-color);"></textarea>
        <button class="button secondary" onclick="app.register()">Зарегистрироваться</button>
    </div>`;
}

