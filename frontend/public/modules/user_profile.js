// frontend/public/modules/user_profile.js
// Этот модуль содержит функции для управления профилем и паролем текущего пользователя.

// Импортируем необходимые API-функции
import {
    updateUserProfileApi, changePasswordApi, requestPasswordResetApi,
    getUserProfile // Требуется для обновления локального state после сохранения
} from '../api.js';

/**
 * Сохраняет изменения в профиле пользователя (имя, ник, год и т.д.).
 * @param {App} appInstance
 */
export async function saveProfile(appInstance) {
    appInstance.playSoundClick();
    const nickname = document.getElementById('profile-nickname')?.value;
    const displayName = document.getElementById('profile-display-name')?.value;
    const yearOfBirth = document.getElementById('profile-year-of-birth')?.value;
    const aboutMe = document.getElementById('profile-about-me')?.value;
    const avatarEmoji = document.getElementById('profile-avatar-emoji')?.value;

    if (displayName && displayName.trim().length < 2) {
         return alert('Имя Фамилия должно содержать не менее 2 символов (если введено).');
    }
    // Используем spread оператор для корректной проверки длины emoji
    if (avatarEmoji && [...avatarEmoji].length !== 1) { 
         return alert('Аватар должен быть одним смайликом.');
    }


    const dataToUpdate = {
        nickname: nickname?.trim() || null,
        display_name: displayName?.trim() || null, // Отправляем null, если пусто
        year_of_birth: yearOfBirth,
        about_me: aboutMe?.trim() || null,
        avatar_emoji: avatarEmoji || null
    };

    // Удаляем null-значения из dataToUpdate, кроме display_name, чтобы не сбросить его на null
    Object.keys(dataToUpdate).forEach(key => {
         if (dataToUpdate[key] === null && key !== 'display_name') {
             delete dataToUpdate[key];
         }
    });


    try {
        await updateUserProfileApi(appInstance.state.token, dataToUpdate);

        // Обновляем локальный state
        if (appInstance.state.user) {
             // Чтобы избежать проблем с синхронизацией имен (если на бэке сгенерировалось что-то)
             // лучше перечитать профиль после сохранения display_name
             if (dataToUpdate.display_name !== undefined) {
                 const updatedProfile = await getUserProfile(appInstance.state.token);
                 appInstance.state.user = updatedProfile;

             } else {
                 if (dataToUpdate.nickname !== undefined) appInstance.state.user.nickname = dataToUpdate.nickname;
                 if (dataToUpdate.year_of_birth !== undefined) appInstance.state.user.year_of_birth = dataToUpdate.year_of_birth;
                 if (dataToUpdate.about_me !== undefined) appInstance.state.user.about_me = dataToUpdate.about_me;
                 if (dataToUpdate.avatar_emoji !== undefined) appInstance.state.user.avatar_emoji = dataToUpdate.avatar_emoji || '🤪';
             }
        }
        alert('Профиль успешно сохранен!');
        appInstance.render(); // Перерисовать, чтобы обновить имя на главном экране, если там
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert(`Ошибка сохранения профиля: ${error.message}`);
    }
}

/**
 * Изменяет пароль текущего пользователя.
 * @param {App} appInstance
 */
export async function changePassword(appInstance) {
    appInstance.playSoundClick();
    const oldPassword = document.getElementById('profile-old-password')?.value;
    const newPassword = document.getElementById('profile-new-password')?.value;
    const confirmPassword = document.getElementById('profile-confirm-password')?.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        return alert('Заполните все поля для смены пароля.');
    }
    if (newPassword.length < 6) {
         return alert('Новый пароль должен быть не менее 6 символов.');
    }
    if (newPassword !== confirmPassword) {
        return alert('Новые пароли не совпадают.');
    }

    try {
        await changePasswordApi(appInstance.state.token, oldPassword, newPassword);
        alert('Пароль успешно изменен!');
        // Очищаем поля
        document.getElementById('profile-old-password').value = '';
        document.getElementById('profile-new-password').value = '';
        document.getElementById('profile-confirm-password').value = '';
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        alert(`Ошибка смены пароля: ${error.message}`);
    }
}

/**
 * Запрашивает сброс пароля текущего пользователя через администратора.
 * @param {App} appInstance
 */
export async function requestPasswordReset(appInstance) {
    appInstance.playSoundClick();
    if (!confirm('Вы уверены, что хотите запросить сброс пароля? Администратор получит уведомление.')) {
         return;
    }
    try {
         const result = await requestPasswordResetApi(appInstance.state.token);
         alert(result.message || 'Запрос на сброс пароля отправлен администратору.');
         // Обновляем счетчик запросов на сброс, если пользователь является админом
         if (appInstance.isAdmin()) {
             await appInstance.loadAdminData();
         }
    } catch (error) {
         console.error('Ошибка запроса сброса пароля:', error);
         alert(`Ошибка: ${error.message}`);
    }
}
