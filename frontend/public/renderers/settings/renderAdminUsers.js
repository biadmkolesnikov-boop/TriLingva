// frontend/public/renderers/settings/renderAdminUsers.js

export function renderAdminUsers(users, appInstance) {
    if (!users || users.length === 0) {
        return `<h2>Управление Пользователями</h2>
                <p>Пользователи не найдены или еще не загружены.</p>
                <button class="button small secondary" onclick="app.loadUsers(false)">Загрузить всех</button>
                <button class="button small secondary" onclick="app.loadUsers(true)">Загрузить запросивших сброс</button>`;
    }

    const tableRows = users.map(user => {
        const isActiveText = user.is_active ? 'Да' : 'Нет';
        const resetRequestedText = user.password_reset_requested ? '⚠️ Да' : 'Нет';
        const toggleActiveButtonText = user.is_active ? 'Деактивировать' : 'Активировать';
        // Не даем админу удалять/деактивировать себя
        const isAdmin = user.email === 'admin@example.com';

        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}${isAdmin ? ' (👑 Admin)' : ''}</td>
                <td>${user.nickname || '-'}</td>
                <td>${user.display_name}</td>
                <td>${user.year_of_birth}</td>
                <td>${isActiveText}</td>
                <td style="color: ${user.password_reset_requested ? 'var(--danger-color)' : 'inherit'}; font-weight: ${user.password_reset_requested ? 'bold' : 'normal'};">${resetRequestedText}</td>
                <td class="admin-user-actions">
                    <button class="button small secondary" title="Сбросить пароль (пользователю потребуется регистрация заново)" onclick="app.adminResetPassword('${user.id}', '${user.email}')">Сбросить пароль</button>
                    <button class="button small secondary" title="Установить новый пароль для пользователя" onclick="app.adminChangePassword('${user.id}', '${user.email}')">Изменить пароль</button>
                    <button class="button small secondary" title="${toggleActiveButtonText} аккаунт" onclick="app.adminToggleUserActive('${user.id}', '${user.email}')" ${isAdmin ? 'disabled' : ''}>${toggleActiveButtonText}</button>
                    <button class="button small" style="background: var(--danger-color);" title="Удалить пользователя навсегда" onclick="app.adminDeleteUser('${user.id}', '${user.email}')" ${isAdmin ? 'disabled' : ''}>Удалить</button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <h2>Управление Пользователями (${users.length})</h2>
        <div style="margin-bottom: 15px; display: flex; gap: 10px;">
             <button class="button small secondary" onclick="app.loadUsers(false)">Показать всех</button>
             <button class="button small secondary" onclick="app.loadUsers(true)">Показать запросивших сброс</button>
        </div>
        <div style="max-height: 60vh; overflow-y: auto;">
            <table class="admin-users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Ник</th>
                        <th>Имя Фамилия</th>
                        <th>Год р.</th>
                        <th>Активен</th>
                        <th>Сброс?</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}
