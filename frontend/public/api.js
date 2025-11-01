// api.js (ПОЛНЫЙ ОБНОВЛЁННЫЙ КОД v22.10)
// --- ИЗМЕНЕНИЕ: saveUserSettingsApi теперь отправляет все настройки ---
// --- ИЗМЕНЕНИЕ (Шаг 2): Добавлен 'type' в API словарей ---
// --- ИЗМЕНЕНИЕ (v22.2): Добавлены API для профиля и управления пользователями ---
// --- ДОБАВЛЕНО (v22.10): API для получения статистики администратора ---

const API_BASE_URL = window.location.origin + '/api';

// Вспомогательная функция для выполнения запросов
async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (body !== null) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
         if (response.status === 204 || response.headers.get('content-length') === '0') {
             // Успешный ответ без тела (например, при сохранении настроек)
             return { success: true, message: 'Операция выполнена успешно (нет данных для возврата).' };
         }
        // Попытка парсинга JSON только если есть тело ответа
        const text = await response.text(); // Сначала получаем текст
        const data = text ? JSON.parse(text) : null; // Парсим, если текст не пустой

        if (!response.ok) {
            // Используем data?.message, если data не null
            throw new Error(data?.message || `HTTP error! status: ${response.status}`);
        }
        return data; // Возвращаем распарсенные данные (или null, если тело было пустым)
    } catch (error) {
        if (error instanceof SyntaxError) {
             console.error(`API Error (${method} ${endpoint}): Failed to parse JSON response.`);
             throw new Error(`Не удалось обработать ответ сервера (не JSON).`);
        } else {
             console.error(`API Error (${method} ${endpoint}):`, error);
             throw error;
        }
    }
}

// --- Функции для взаимодействия с API ---

// --- ИЗМЕНЕНИЕ (v22.2): Обновлена функция регистрации ---
export async function registerUser(email, password, displayName, yearOfBirth, nickname, aboutMe, avatarEmoji) {
    const body = {
        email,
        password,
        display_name: displayName,
        year_of_birth: yearOfBirth,
        nickname: nickname || null, // Отправляем null, если пусто
        about_me: aboutMe || null,
        avatar_emoji: avatarEmoji || null // null приведет к дефолту на бэке
    };
    return await request('/register', 'POST', body);
}
// --- КОНЕЦ ИЗМЕНЕНИЯ ---


export async function loginUser(email, password) {
    return await request('/login', 'POST', { email, password });
}

export async function getUserProfile(token) {
    return await request('/profile', 'GET', null, token);
}

// --- ДОБАВЛЕНО (v22.2): API для обновления профиля ---
export async function updateUserProfileApi(token, profileData) {
    // profileData может содержать: nickname, display_name, year_of_birth, about_me, avatar_emoji
    return await request('/profile', 'PUT', profileData, token);
}

export async function changePasswordApi(token, old_password, new_password) {
    return await request('/profile', 'PUT', { old_password, new_password }, token);
}

// --- ДОБАВЛЕНО (v22.2): API для сброса пароля пользователем ---
export async function requestPasswordResetApi(token) {
    // Тело не нужно, email берется из токена на бэке
    return await request('/request-password-reset', 'POST', {}, token);
}
// --- КОНЕЦ ДОБАВЛЕНИЯ ---


// --- Функция для сохранения настроек ---
export async function saveUserSettingsApi(token, settings) {
    // --- ИЗМЕНЕНО (v18.4): Отправляем весь объект settings ---
    console.log("Отправка настроек на сервер:", settings); // Лог для отладки
    return await request('/settings', 'POST', { settings }, token);
}
// --- КОНЕЦ ИЗМЕНЕНИЯ ---


export async function loadTrainingMaterials(token) {
    return await request('/training-materials', 'GET', null, token);
}

export async function loadUserProgressApi(token) {
    return await request('/progress', 'GET', null, token);
}

export async function saveUserProgress(token, profileKey, progressData) {
    return await request('/progress', 'POST', { profile_key: profileKey, progressData }, token);
}

// --- API для Редактора Словарей ---
// (ИЗМЕНЕНО) Добавлен 'type' (words/phrases)
export async function getDictionary(token, level, type) {
     return await request(`/dictionary/${level}/${type}`, 'GET', null, token);
}

// (ИЗМЕНЕНО) Добавлен 'type' (words/phrases)
export async function addDictionaryWordApi(token, level, type, { ru, cz, en, category }) {
     return await request(`/dictionary/${level}/${type}`, 'POST', { ru, cz, en, category }, token);
}

// (ИЗМЕНЕНО) Добавлен 'type' (words/phrases)
export async function updateDictionaryWordApi(token, level, type, { oldRu, oldCategory, newRu, newCz, newEn, newCategory }) {
     return await request(`/dictionary/${level}/${type}`, 'PUT', { oldRu, oldCategory, newRu, newCz, newEn, newCategory }, token);
}

// (ИЗМЕНЕНО) Добавлен 'type' (words/phrases)
export async function deleteDictionaryWordsApi(token, level, type, itemsToDelete) {
     return await request(`/dictionary/${level}/${type}`, 'DELETE', { itemsToDelete }, token);
}

// (ИЗМЕНЕНО) Добавлен 'type' (words/phrases)
export async function importDictionaryApi(token, level, type, { czech, english }) {
     // Убедимся, что отправляем правильную структуру
     return await request(`/dictionary/${level}/${type}/import`, 'POST', { czech: czech, english: english }, token);
}

// --- API для Историй ---
export async function uploadStoryApi(token, storyData) {
     return await request(`/stories`, 'POST', storyData, token);
}

export async function deleteStoryApi(token, storyId) {
     return await request(`/stories/${storyId}`, 'DELETE', null, token);
}

// --- API для Тем ---
 export async function getActiveThemeApi(token) {
     return await request(`/themes/active`, 'GET', null, token);
 }

 export async function getAllThemesApi(token) {
     return await request(`/themes`, 'GET', null, token);
 }

 export async function addThemeApi(token, { name, colors }) {
    return await request(`/themes`, 'POST', { name, colors }, token);
 }

 export async function updateThemeApi(token, themeId, { name, colors }) {
     return await request(`/themes/${themeId}`, 'PUT', { name, colors }, token);
 }

 export async function deleteThemeApi(token, themeId) {
    return await request(`/themes/${themeId}`, 'DELETE', null, token);
 }

 export async function activateThemeApi(token, themeId) {
     return await request(`/themes/${themeId}/activate`, 'POST', null, token);
 }

 export async function setUserThemeApi(token, themeId) {
    return await request(`/user/theme`, 'POST', { themeId }, token);
 }

// --- ДОБАВЛЕНО (v22.2): API для Админки Управления Пользователями ---
export async function getAllUsersApi(token, filterResetRequested = false) {
    let endpoint = '/admin/users';
    if (filterResetRequested) {
        endpoint += '?resetRequested=true';
    }
    return await request(endpoint, 'GET', null, token);
}

export async function adminResetPasswordApi(token, userId) {
    return await request(`/admin/users/${userId}/reset-password`, 'POST', {}, token);
}

export async function adminChangePasswordApi(token, userId, new_password) {
    return await request(`/admin/users/${userId}/change-password`, 'PUT', { new_password }, token);
}

export async function adminToggleUserActiveApi(token, userId) {
    return await request(`/admin/users/${userId}/toggle-active`, 'PUT', {}, token);
}

export async function adminDeleteUserApi(token, userId) {
    return await request(`/admin/users/${userId}`, 'DELETE', null, token);
}
// --- КОНЕЦ ДОБАВЛЕНО (v22.2) ---

// --- ДОБАВЛЕНО (v22.10): API для получения статистики администратора ---
export async function getAdminStatsApi(token) {
    return await request('/admin/stats', 'GET', null, token);
}
// --- КОНЕЦ ДОБАВЛЕНИЯ ---
