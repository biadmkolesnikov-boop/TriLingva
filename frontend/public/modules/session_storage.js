// frontend/public/modules/session_storage.js
// Этот модуль содержит логику для сохранения и восстановления активных сессий
// тренировки в localStorage.

/**
 * Генерирует уникальный ключ для localStorage, основанный на ID пользователя и ID профиля.
 * @param {App} appInstance
 * @returns {string|null}
 */
function _getLocalStorageSessionKey(appInstance) {
    const userId = appInstance.state.user?.id;
    const profileId = appInstance.state.activeProfileId;
    if (!userId || !profileId) {
        return null;
    }
    return `bilingvo_session_${userId}_${profileId}`;
}

/**
 * Загружает активные сессии из localStorage и объединяет их с серверными.
 * @param {App} appInstance
 */
export function loadActiveSessionsFromLocalStorage(appInstance) {
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const serverSessions = profile.sessions || { czech: null, english: null, bilingual: null };
    const sessionKey = _getLocalStorageSessionKey(appInstance);

    if (!sessionKey) {
         profile.sessions = { ...serverSessions };
         return;
    }

    const storedSessions = localStorage.getItem(sessionKey);

    if (storedSessions) {
        try {
            let parsedSessions = JSON.parse(storedSessions);
            // Восстанавливаем Set из объектов
            Object.values(parsedSessions).forEach(session => {
                if (session && typeof session === 'object') {
                    // Восстановление Set для seenWords
                    if (session.seenWords && typeof session.seenWords === 'object' && !Array.isArray(session.seenWords)) {
                         session.seenWords = new Set(Object.keys(session.seenWords));
                    } else if (!session.seenWords || !Array.isArray(session.seenWords)) {
                         session.seenWords = new Set();
                    } else if (Array.isArray(session.seenWords)) { // Миграция со старого формата массива
                         session.seenWords = new Set(session.seenWords);
                    }
                    // Восстановление Set для usedHints
                    if (session.usedHints && typeof session.usedHints === 'object' && !Array.isArray(session.usedHints)) {
                        session.usedHints = new Set(Object.keys(session.usedHints));
                    } else if (!session.usedHints || !Array.isArray(session.usedHints)) {
                        session.usedHints = new Set();
                    } else if (Array.isArray(session.usedHints)) { // Миграция со старого формата массива
                        session.usedHints = new Set(session.usedHints);
                    }
                    session.autoAdvanceTimerId = null; // Очищаем временный ID таймера
                }
            });
            // Объединяем серверные сессии с локальными (локальные имеют приоритет, если они были)
            profile.sessions = { ...serverSessions, ...parsedSessions };
            console.log(`Активные сессии ОБЪЕДИНЕНЫ из localStorage для ${appInstance.state.activeProfileId}`);
        } catch (e) {
            console.error("Не удалось разобрать сохраненные сессии:", e);
            localStorage.removeItem(sessionKey);
            profile.sessions = { ...serverSessions }; // Используем только серверные
        }
    } else {
        console.log(`Нет сохраненных сессий в localStorage для ${appInstance.state.activeProfileId}, используются серверные.`);
        profile.sessions = { ...serverSessions };
    }

    if (!profile.sessions) {
        profile.sessions = { czech: null, english: null, bilingual: null };
    }
}

/**
 * Сохраняет текущие активные сессии в localStorage.
 * @param {App} appInstance
 */
export function saveActiveSessionsToLocalStorage(appInstance) {
    const profile = appInstance.getActiveProfile();
    const sessionKey = _getLocalStorageSessionKey(appInstance);
    if (!sessionKey || !profile || !profile.sessions) return;
    try {
        // Создаем копию для хранения, чтобы преобразовать Set в объект
        const sessionsToStore = JSON.parse(JSON.stringify(profile.sessions));
        Object.values(sessionsToStore).forEach(session => {
            if (session && typeof session === 'object') {
                const originalSession = profile.sessions[session.language || profile.language]; // Находим оригинальную сессию
                if (originalSession) {
                    // Преобразование Set в объект { слово: true, ... }
                    if (originalSession.seenWords instanceof Set) {
                        session.seenWords = Array.from(originalSession.seenWords).reduce((obj, word) => { obj[word] = true; return obj; }, {});
                    }
                    if (originalSession.usedHints instanceof Set) {
                         session.usedHints = Array.from(originalSession.usedHints).reduce((obj, word) => { obj[word] = true; return obj; }, {});
                    }
                }
                delete session.autoAdvanceTimerId; // Удаляем ID таймера перед сохранением
            }
        });
        localStorage.setItem(sessionKey, JSON.stringify(sessionsToStore));
        // console.log("Session saved to localStorage:", sessionKey); // Опциональный лог
    } catch (e) {
        console.error("Ошибка при сохранении сессий в localStorage:", e);
    }
}

/**
 * Очищает данные сессии для текущего активного профиля в localStorage.
 * @param {App} appInstance
 */
export function clearActiveSessionsFromLocalStorage(appInstance) {
     const sessionKey = _getLocalStorageSessionKey(appInstance);
     if (sessionKey) {
         localStorage.removeItem(sessionKey);
         console.log(`Хранилище сессий localStorage очищено для ${sessionKey}`);
     }
}
