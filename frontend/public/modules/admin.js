// frontend/public/modules/admin.js
// Этот модуль содержит функции для администрирования пользователей

// Импортируем необходимые API-функции
import {
    getAllUsersApi,
    adminResetPasswordApi,
    adminChangePasswordApi,
    adminToggleUserActiveApi,
    adminDeleteUserApi
} from '../api.js';

/**
 * Загружает счетчик запросов на сброс пароля.
 * @param {App} appInstance
 */
export async function loadAdminData(appInstance) {
    if (!appInstance.isAdmin() || !appInstance.state.token) return;
    try {
        // Загружаем только пользователей с запросом на сброс для счетчика
        const usersWithRequests = await getAllUsersApi(appInstance.state.token, true);
        appInstance.state.admin.resetRequestsCount = usersWithRequests.length;
        console.log("Admin data loaded, reset requests:", usersWithRequests.length);
         if(appInstance.state.screen === 'start') appInstance.render(); // Обновить иконку на главном экране
    } catch (error) {
         console.error("Ошибка загрузки данных админки:", error);
         appInstance.state.admin.resetRequestsCount = 0; // Сбросить счетчик при ошибке
    }
}

/**
 * Загружает полный список пользователей для вкладки "Пользователи" в настройках.
 * @param {App} appInstance
 * @param {boolean} filterRequests - Фильтровать ли только тех, кто запросил сброс
 */
export async function loadAdminUsers(appInstance, filterRequests = false) {
    if (!appInstance.isAdmin() || !appInstance.state.token) return;
    appInstance.state.admin.isLoadingUsers = true;
    appInstance.state.admin.filterResetRequests = filterRequests; // Запоминаем фильтр
    if(appInstance.state.screen === 'userSettings') appInstance.render(); // Показать "Загрузка..."

    try {
        appInstance.state.admin.users = await getAllUsersApi(appInstance.state.token, filterRequests);
        // Пересчитываем resetRequestsCount на основе *полного* списка (если фильтр выключен)
        if (!filterRequests) {
             appInstance.state.admin.resetRequestsCount = appInstance.state.admin.users.filter(u => u.password_reset_requested).length;
        }
        console.log("Admin users loaded:", appInstance.state.admin.users.length);
    } catch (error) {
        console.error("Ошибка загрузки списка пользователей:", error);
        alert(`Ошибка загрузки пользователей: ${error.message}`);
        appInstance.state.admin.users = []; // Очистить список при ошибке
    } finally {
        appInstance.state.admin.isLoadingUsers = false;
        if(appInstance.state.screen === 'userSettings') appInstance.render(); // Показать результат
    }
}

/**
 * Сбрасывает пароль пользователя (админ).
 * @param {App} appInstance
 * @param {string} userId
 * @param {string} userEmail
 */
export async function adminResetPassword(appInstance, userId, userEmail) {
    appInstance.playSoundClick();
    if (!confirm(`Вы уверены, что хотите сбросить пароль для пользователя ${userEmail}? Пользователю потребуется зарегистрироваться заново.`)) {
         return;
    }
    try {
        const result = await adminResetPasswordApi(appInstance.state.token, userId);
        alert(result.message || `Пароль для ${userEmail} сброшен.`);
        // Используем appInstance для вызова метода, который теперь является оберткой
        await appInstance.loadAdminUsers(appInstance.state.admin.filterResetRequests); // Перезагружаем с текущим фильтром
        await appInstance.loadAdminData();

    } catch (error) {
         console.error('Ошибка сброса пароля админом:', error);
         alert(`Ошибка: ${error.message}`);
    }
}

/**
 * Изменяет пароль пользователя (админ).
 * @param {App} appInstance
 * @param {string} userId
 * @param {string} userEmail
 */
export async function adminChangePassword(appInstance, userId, userEmail) {
    appInstance.playSoundClick();
    const newPassword = prompt(`Введите новый пароль для ${userEmail} (мин. 6 символов):`);
    if (newPassword === null) return; // Пользователь нажал "Отмена"
    if (!newPassword || newPassword.length < 6) {
        return alert('Пароль должен быть не менее 6 символов.');
    }

    try {
        const result = await adminChangePasswordApi(appInstance.state.token, userId, newPassword);
        alert(result.message || `Пароль для ${userEmail} изменен.`);
    } catch (error) {
         console.error('Ошибка изменения пароля админом:', error);
         alert(`Ошибка: ${error.message}`);
    }
}

/**
 * Переключает статус (активен/неактивен) пользователя (админ).
 * @param {App} appInstance
 * @param {string} userId
 * @param {string} userEmail
 */
export async function adminToggleUserActive(appInstance, userId, userEmail) {
    appInstance.playSoundClick();
    const user = appInstance.state.admin.users.find(u => u.id === userId);
    const action = user?.is_active ? 'деактивировать' : 'активировать';
    if (!confirm(`Вы уверены, что хотите ${action} пользователя ${userEmail}?`)) {
         return;
    }

    try {
        const result = await adminToggleUserActiveApi(appInstance.state.token, userId);
        alert(result.message || `Статус пользователя ${userEmail} изменен.`);
        const userIndex = appInstance.state.admin.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
             appInstance.state.admin.users[userIndex].is_active = result.is_active;
             appInstance.render(); // Перерисовать таблицу
        } else {
             await appInstance.loadAdminUsers(appInstance.state.admin.filterResetRequests); // Перезагрузить, если не нашли
        }
    } catch (error) {
         console.error(`Ошибка ${action} пользователя:`, error);
         alert(`Ошибка: ${error.message}`);
    }
}

/**
 * Удаляет пользователя (админ).
 * @param {App} appInstance
 * @param {string} userId
 * @param {string} userEmail
 */
export async function adminDeleteUser(appInstance, userId, userEmail) {
    appInstance.playSoundClick();
     if (!confirm(`ТОЧНО удалить пользователя ${userEmail}? Это действие НЕОБРАТИМО и удалит весь его прогресс!`)) {
          return;
     }
     if (!confirm(`ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ: Удаляем ${userEmail}?`)) {
          return;
     }

     try {
         const result = await adminDeleteUserApi(appInstance.state.token, userId);
         alert(result.message || `Пользователь ${userEmail} удален.`);
         await appInstance.loadAdminUsers(appInstance.state.admin.filterResetRequests);
         await appInstance.loadAdminData(); // Обновить счетчик на всякий случай
     } catch (error) {
          console.error('Ошибка удаления пользователя админом:', error);
          alert(`Ошибка: ${error.message}`);
     }
}
