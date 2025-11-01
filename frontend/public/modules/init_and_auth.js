// frontend/public/modules/init_and_auth.js
// Этот модуль содержит логику входа, выхода, регистрации и начальной загрузки данных приложения.

import {
    loginUser, registerUser, getUserProfile,
    loadTrainingMaterials
} from '../api.js';

/**
 * Загружает все учебные материалы (словари и истории) с сервера.
 * @param {App} appInstance
 * @returns {Promise<boolean>}
 */
export async function loadAllTrainingData(appInstance) {
    if (!appInstance.state.token) return false;
    try {
        const data = await loadTrainingMaterials(appInstance.state.token);
        appInstance.state.userDictionaries = data.levels || {};
        appInstance.state.customStories = data.custom || {};
        console.log('Учебные материалы успешно загружены с сервера!');
        return true;
    } catch (error) {
        console.error('Критическая ошибка при загрузке учебных данных:', error);
        return false;
    }
}

/**
 * Загружает состояние пользователя и профиль на основе токена, восстанавливает UI state.
 * @param {App} appInstance
 * @returns {Promise<boolean>}
 */
export async function loadStateAndUser(appInstance) {
    console.log("Loading state and user...");
    if (appInstance.state.token) {
        console.log("Token found, loading training data...");
        // 1. Загрузка всех учебных материалов
        const dataLoaded = await loadAllTrainingData(appInstance);
        if (!dataLoaded) { appInstance.logout(); return false; }

        console.log("Loading user progress...");
        // 2. Загрузка прогресса
        await appInstance.loadUserProgress();

        console.log("Loading user profile...");
        try {
            // 3. Получение профиля
            const userProfile = await getUserProfile(appInstance.state.token);
            if (!userProfile) { throw new Error("Профиль пользователя не найден."); }
            appInstance.state.user = userProfile;
            console.log("User profile loaded:", userProfile.email);

            // 4. Загрузка и слияние настроек
            const serverSettings = userProfile.settings || {};
            appInstance.state.settings = { ...appInstance.defaultSettings, ...serverSettings };
            console.log("User settings loaded and merged:", appInstance.state.settings);

            // 5. Восстановление UI State из sessionStorage
            const lastScreen = sessionStorage.getItem('lastScreen');
            const lastProfileId = sessionStorage.getItem('activeProfileId');
            console.log("Restoring UI state - Screen:", lastScreen, "Profile:", lastProfileId);

            const safeScreens = ['start', 'login', 'profileSelection', 'userSettings', 'about', 'dictionaryEditor', 'storyEditor'];
            const profileScreens = ['profileDashboard', 'wordSelection', 'training', 'stage2', 'stage3', 'completion', 'globalCompletion'];

            if (lastScreen && lastProfileId && profileScreens.includes(lastScreen)) {
                appInstance.state.screen = lastScreen;
                appInstance.state.activeProfileId = lastProfileId;
                appInstance.loadActiveProfileData();
                const savedLang = sessionStorage.getItem('dashboardLanguage');
                if(savedLang && appInstance.state.progress[lastProfileId]) {
                     appInstance.state.progress[lastProfileId].language = savedLang;
                }
                appInstance.loadActiveSessionsFromLocalStorage();

            } else if (lastScreen && safeScreens.includes(lastScreen)) {
                appInstance.state.screen = lastScreen;
                if (lastScreen === 'userSettings') {
                     const savedTab = sessionStorage.getItem('settingsActiveTab');
                     appInstance.state.settingsActiveTab = savedTab || 'general';
                     console.log("Restored settings tab:", appInstance.state.settingsActiveTab);
                } else if (lastScreen === 'dictionaryEditor') {
                    const savedLevel = sessionStorage.getItem('editorLevel');
                    const savedDictType = sessionStorage.getItem('editorDictType');
                    if (savedLevel) appInstance.state.editor.level = savedLevel;
                    if (savedDictType) appInstance.state.editor.dictType = savedDictType;
                    console.log("Restored Dictionary Editor state:", appInstance.state.editor.level, appInstance.state.editor.dictType);
                } else if (lastScreen === 'storyEditor') {
                    const savedStoryId = sessionStorage.getItem('editorActiveStoryId');
                    if (savedStoryId) appInstance.state.editor.activeStoryId = savedStoryId;
                    console.log("Restored Story Editor state, activeStoryId:", appInstance.state.editor.activeStoryId);
                }
            } else {
                console.log("No valid screen state found, defaulting to 'start'");
                appInstance.state.screen = 'start';
                sessionStorage.setItem('lastScreen', 'start');
                sessionStorage.removeItem('activeProfileId');
            }
             console.log("Final screen state after restore:", appInstance.state.screen);
             return true;

        } catch(e) {
            console.error("Не удалось получить профиль пользователя:", e.message);
            appInstance.logout();
            return false;
        }
    } else {
        console.log("No token found, setting screen to 'login'");
        appInstance.state.screen = 'login';
        return true;
    }
}

/**
 * Выполняет вход пользователя.
 * @param {App} appInstance
 */
export async function login(appInstance) {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) return alert('Введите email и пароль');

    try {
        console.log("Attempting login...");
        const data = await loginUser(email, password);
        console.log("Login API successful, token received.");

        // 1. Сохранение токена и очистка
        localStorage.setItem('token', data.token);
        appInstance.state.token = data.token;
        sessionStorage.clear();
        console.log("Token saved, sessionStorage cleared.");

        // 2. Загрузка данных и состояния
        console.log("Loading data and user state after login...");
        const stateLoaded = await loadStateAndUser(appInstance);
        if (!stateLoaded) throw new Error("Не удалось загрузить состояние пользователя после входа.");
        console.log("User state and profile loaded. Screen should be:", appInstance.state.screen);

        // 3. Дополнительные загрузки
        if (appInstance.isAdmin()) {
             await appInstance.loadAdminData();
        }

        // 4. Применение UI настроек
        await appInstance.applyThemeFromServer();
        appInstance.applyFontSettings();

        // 5. Рендеринг
        appInstance.render();
        console.log("Login process completed.");

    } catch (error) {
        console.error("Login failed:", error);
        alert(`Ошибка входа: ${error.message}`);
        localStorage.removeItem('token');
        appInstance.state.token = null;
    }
}

/**
 * Выполняет регистрацию нового пользователя.
 * @param {App} appInstance
 */
export async function register(appInstance) {
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const displayName = document.getElementById('register-display-name')?.value;
    const yearOfBirth = document.getElementById('register-year-of-birth')?.value;
    const nickname = document.getElementById('register-nickname')?.value;
    const avatarEmoji = document.getElementById('register-avatar-emoji')?.value;
    const aboutMe = document.getElementById('register-about-me')?.value;

    // Валидация на фронте
    if (!email || !password || !displayName || !yearOfBirth) {
        return alert('Пожалуйста, заполните все обязательные поля (*).');
    }
    if (password.length < 6) {
         return alert('Пароль должен быть не менее 6 символов.');
    }
     if (displayName && displayName.trim().length < 2) {
         return alert('Имя Фамилия должно содержать не менее 2 символов (если введено).');
     }
     if (avatarEmoji && [...avatarEmoji].length === 1) { // Используем спред для корректной длины emoji
          // OK
     } else if (avatarEmoji && [...avatarEmoji].length > 1) {
          return alert('Аватар должен быть одним смайликом.');
     }

    try {
        const data = await registerUser(
            email, password, displayName, yearOfBirth,
            nickname, aboutMe, avatarEmoji
        );
        alert(data.message || 'Регистрация прошла успешно! Теперь вы можете войти.');
        // Очищаем поля формы входа/регистрации
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-display-name').value = '';
        document.getElementById('register-year-of-birth').value = '';
        document.getElementById('register-nickname').value = '';
        document.getElementById('register-avatar-emoji').value = '';
        document.getElementById('register-about-me').value = '';
    } catch (error) {
        alert(`Ошибка регистрации: ${error.message}`);
    }
}

/**
 * Выполняет выход пользователя и сброс состояния приложения.
 * @param {App} appInstance
 */
export function logout(appInstance) {
    console.log("Logging out...");
    // 1. Очистка хранилищ
    localStorage.removeItem('token');
    sessionStorage.clear();

    // 2. Сброс состояния (сохраняем только editor state)
    const editorState = appInstance.state.editor;
    appInstance.state = {
        token: null, user: null, screen: 'login',
        customStories: {}, userDictionaries: {}, progress: {},
        themes: [], themeEditorLoaded: false,
        settings: { ...appInstance.defaultSettings },
        editor: editorState,
        settingsActiveTab: 'general',
        admin: { users: [], resetRequestsCount: 0, isLoadingUsers: false, filterResetRequests: false }
    };

    // 3. Сброс кэшей данных
    appInstance.activeData = {};
    appInstance.ruCzechDict = {}; appInstance.ruEnglishDict = {}; appInstance.invertedDictionary = {};
    appInstance.categorizedCzechWords = {}; appInstance.categorizedCzechPhrases = {};
    appInstance.categorizedEnglishWords = {}; appInstance.categorizedEnglishPhrases = {};
    appInstance.categoryOpenState = {};

    // 4. Остановка анимации
    appInstance.stopMatrix();

    // 5. Применение дефолтных стилей и рендеринг
    appInstance.applyThemeFromServer();
    appInstance.applyFontSettings();
    appInstance.render();
}
