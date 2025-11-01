// frontend/public/main.js
// Основной класс приложения, который инициализирует все компоненты
// и управляет глобальным состоянием и навигацией.

// Импорты, необходимые для логики, которая осталась в main.js
import {
    saveUserSettingsApi,
    // Все остальные API-функции, необходимые для заглушек/делегатов
    getDictionary, addDictionaryWordApi, updateDictionaryWordApi,
    deleteDictionaryWordsApi, importDictionaryApi,
    uploadStoryApi, deleteStoryApi
} from './api.js';

// Импорты рендереров
import {
    renderLogin, renderStart, renderProfileSelection,
    renderProfileDashboard, renderUserSettings, renderWordSelection,
    renderTraining, renderStage2, renderStage3, renderCompletion,
    renderGlobalCompletion, renderAbout, renderFooter, renderDictionaryEditor,
    renderStoryEditor
} from './renderer.js';

// --- ИЗМЕНЕНИЕ: Импорты из training.js ---
// Теперь импортируем только то, что там осталось
import {
    startNewSession as startNewSessionFunc,
    continueSession as continueSessionFunc,
    // startStage2 as startStage2Func, // УДАЛЕНО
    // checkStage2 as checkStage2Func, // УДАЛЕНО
    // showHintStage2 as showHintStage2Func, // УДАЛЕНО
    startStage3 as startStage3Func,
    handleStage3Input as handleStage3InputFunc
} from './training.js';
// --- КОНЕЦ ИЗМЕНЕНИЯ ---

// Импорты функций для редактора
import {
    setEditorState as setEditorStateFunc,
    applySearch as applySearchFunc,
    toggleSearchField as toggleSearchFieldFunc,
    toggleDictItemSelection as toggleDictItemSelectionFunc,
    toggleSelectAll as toggleSelectAllFunc,
    updateDictionaryWord as updateDictionaryWordFunc,
    addDictionaryWord as addDictionaryWordFunc,
    deleteSelected as deleteSelectedFunc,
    exportDictionary as exportDictionaryFunc,
    importDictionary as importDictionaryFunc,
    loadCustomStory as loadCustomStoryFunc,
    saveStory as saveStoryFunc,
    deleteCustomStory as deleteCustomStoryFunc,
} from './editors.js';

// --- ИМПОРТЫ МОДУЛЕЙ, СОЗДАННЫХ В ПРОЦЕССЕ РЕФАКТОРИНГА ---
import {
    applyThemeFromServer, loadAllThemes as loadAllThemesFunc, applyThemePreview,
    updateTheme as updateThemeFunc, activateTheme as activateThemeFunc,
    addNewTheme as addNewThemeFunc, deleteTheme as deleteThemeFunc,
    setUserTheme as setUserThemeFunc
} from './modules/theme.js';

import {
    getSetting as getSettingFunc, setUserSetting as setUserSettingFunc,
    applyFontSettings as applyFontSettingsFunc, saveSettingsToServer as saveSettingsToServerFunc
} from './modules/settings.js';

import {
    loadUserProgress as loadUserProgressFunc,
    saveCurrentProfileProgress as saveCurrentProfileProgressFunc,
    completeStage1 as completeStage1Func, completeStage2 as completeStage2Func,
    finishStage3 as finishStage3Func, resetActiveProfile as resetActiveProfileFunc,
    calculateTotalScore as calculateTotalScoreFunc, renderScores as renderScoresFunc
} from './modules/progress.js';

import {
    playSoundClick as playSoundClickFunc, playSoundFlip as playSoundFlipFunc,
    playSoundError as playSoundErrorFunc, playSoundCorrect as playSoundCorrectFunc,
    showEasterEgg as showEasterEggFunc, initMatrix as initMatrixFunc,
    stopMatrix as stopMatrixFunc,
    focusNextStage3Input as focusNextStage3InputFunc, ensureCategorized as ensureCategorizedFunc,
    mergeDictionariesCategorized as mergeDictionariesCategorizedFunc, toggleAllCategories as toggleAllCategoriesFunc,
    showTooltip as showTooltipFunc, hideTooltip as hideTooltipFunc,
    escapeTooltip as escapeTooltipFunc, findContext as findContextFunc,
    getEmojiProgress as getEmojiProgressFunc, playSound as playSoundFunc,
    initAudio as initAudioFunc
} from './modules/app_utils.js';

import {
    loadAdminData as loadAdminDataFunc,
    loadAdminUsers as loadAdminUsersFunc,
    adminResetPassword as adminResetPasswordFunc,
    adminChangePassword as adminChangePasswordFunc,
    adminToggleUserActive as adminToggleUserActiveFunc,
    adminDeleteUser as adminDeleteUserFunc
} from './modules/admin.js';

import {
    saveProfile as saveProfileFunc,
    changePassword as changePasswordFunc,
    requestPasswordReset as requestPasswordResetFunc
} from './modules/user_profile.js';

import {
    loadStateAndUser as loadStateAndUserFunc,
    login as loginFunc,
    register as registerFunc,
    logout as logoutFunc,
    loadAllTrainingData as loadAllTrainingDataFunc
} from './modules/init_and_auth.js';

import {
    getActiveProfile as getActiveProfileFunc,
    setActiveProfile as setActiveProfileFunc,
    loadActiveProfileData as loadActiveProfileDataFunc
} from './modules/profile_data.js';

import {
    loadActiveSessionsFromLocalStorage as loadActiveSessionsFromLocalStorageFunc,
    saveActiveSessionsToLocalStorage as saveActiveSessionsToLocalStorageFunc,
    clearActiveSessionsFromLocalStorage as clearActiveSessionsFromLocalStorageFunc
    // _getLocalStorageSessionKey теперь внутренний метод, используемый в модуле
} from './modules/session_storage.js';

import {
    setSettingsTab as setSettingsTabFunc,
    setSessionState as setSessionStateFunc,
    toggleAutoAdvance as toggleAutoAdvanceFunc,
    changeLanguage as changeLanguageFunc,
    navigateToUserSettings as navigateToUserSettingsFunc,
    attachThemePreviewHandlers as attachThemePreviewHandlersFunc
} from './modules/ui_management.js';

import {
    attachKeydownHandlers as attachKeydownHandlersFunc
} from './modules/event_handlers.js';

import {
    applyPostRenderEffects as applyPostRenderEffectsFunc
} from './modules/post_render_logic.js';

import {
    renderAppContent as renderAppContentFunc
} from './modules/content_renderer.js';

import {
    applyPreRenderEffects as applyPreRenderEffectsFunc
} from './modules/pre_render_logic.js';

import {
    selectWord as selectWordFunc,
    selectAllWords as selectAllWordsFunc,
    deselectAllWords as deselectAllWordsFunc,
    selectCategory as selectCategoryFunc
} from './modules/word_selection.js';

// --- ИЗМЕНЕНИЕ: Импорт нового модуля Этапа 1 ---
import {
    startTraining as startTrainingFunc,
    handleLetterInput as handleLetterInputFunc,
    checkWord as checkWordFunc,
    showHint as showHintFunc,
    buyHeart as buyHeartFunc
} from './modules/training_stage1.js';
// --- КОНЕЦ ИЗМЕНЕНИЯ ---

// --- ДОБАВЛЕНО: Импорт нового модуля Этапа 2 ---
import {
    startStage2 as startStage2Func,
    checkStage2 as checkStage2Func,
    showHintStage2 as showHintStage2Func
} from './modules/training_stage2.js';
// --- КОНЕЦ ДОБАВЛЕНИЯ ---

import {
    renderAppFooter as renderAppFooterFunc
} from './modules/footer_renderer.js';


// --- КОНСТРУКТОР КЛАССА APP ---

class App {
    constructor() {
        // --- ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ (восстановлены) ---
        this.defaultSettings = {
            repetitions: 5, autoAdvanceDelay: 1, minWords: 1, soundsEnabled: true, futuristicView: false,
            globalFontSize: '16px', globalFontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            easterEggTrigger1: 6, easterEggTrigger2: 7, easterEggEmoji1: '😈', easterEggEmoji2: '😇',
            easterEggMultiEmoji1: '😈😈😈', easterEggMultiEmoji2: '😇😇😇😇😇😇😇', easterEggCycleLength: 3,
            masterEmoji1: '🎉', masterEmoji2: '🥳', masterEmoji3: '🎊',
            easterEggFontSize: '80px'
        };

        this.state = {
            token: null, user: null, screen: 'login',
            customStories: {}, userDictionaries: {}, progress: {},
            themes: [], themeEditorLoaded: false,
            settings: { ...this.defaultSettings },
            editor: {
                level: 'A1', searchTerm: '', sortBy: 'ru', selectedItems: [],
                searchFields: { ru: true, cz: true, en: true, cat: true },
                activeStoryId: null, focusOnWord: null,
                activeThemeEditId: null,
                dictType: 'words' // 'words' или 'phrases'
            },
            settingsActiveTab: 'general',
            admin: {
                users: [],
                resetRequestsCount: 0,
                isLoadingUsers: false,
                filterResetRequests: false
            }
        };
        this.apiBaseUrl = window.location.origin + '/api';
        this.defaultProfileState = { language: 'czech', progress: { czech: {}, english: {}, bilingual: {} }, sessions: { czech: null, english: null, bilingual: null }};

        this.activeData = {};
        this.ruCzechDict = {};
        this.ruEnglishDict = {};
        this.invertedDictionary = {};
        this.categorizedCzechWords = {};
        this.categorizedCzechPhrases = {};
        this.categorizedEnglishWords = {};
        this.categorizedEnglishPhrases = {};

        this.categoryOpenState = {};
        this.settingsScrollPosition = 0;
        this.scrollPosition = 0;
        this.easterEggCounter = 0; this.easterEggCycle = 0; this.audioCtx = null; this.enterPressCount = 0; this.enterConfirmTimeout = null; this.dashboardEnterCount = 0; this.matrixInterval = null;
        this.saveSettingsTimeout = null;
        this.matrixInitialized = false;

        this.init();
    }

    // --- ДЕЛЕГИРОВАННЫЕ МЕТОДЫ (Оркестрация) ---

    // modules/admin.js
    async loadAdminData() { await loadAdminDataFunc(this); }
    async loadAdminUsers(filterRequests = false) { await loadAdminUsersFunc(this, filterRequests); }
    async adminResetPassword(userId, userEmail) { await adminResetPasswordFunc(this, userId, userEmail); }
    async adminChangePassword(userId, userEmail) { await adminChangePasswordFunc(this, userId, userEmail); }
    async adminToggleUserActive(userId, userEmail) { await adminToggleUserActiveFunc(this, userId, userEmail); }
    async adminDeleteUser(userId, userEmail) { await adminDeleteUserFunc(this, userId, userEmail); }

    // modules/user_profile.js
    async saveProfile() { await saveProfileFunc(this); }
    async changePassword() { await changePasswordFunc(this); }
    async requestPasswordReset() { await requestPasswordResetFunc(this); }

    // modules/init_and_auth.js
    async loadStateAndUser() { await loadStateAndUserFunc(this); }
    async login() { await loginFunc(this); }
    async register() { await registerFunc(this); }
    logout() { logoutFunc(this); }
    async loadAllTrainingData() { return await loadAllTrainingDataFunc(this); }

    // modules/profile_data.js
    getActiveProfile() { return getActiveProfileFunc(this); }
    setActiveProfile(profileId) { setActiveProfileFunc(this, profileId); }
    loadActiveProfileData() { loadActiveProfileDataFunc(this); }

    // modules/session_storage.js
    loadActiveSessionsFromLocalStorage() { loadActiveSessionsFromLocalStorageFunc(this); }
    saveActiveSessionsToLocalStorage() { saveActiveSessionsToLocalStorageFunc(this); }
    clearActiveSessionsFromLocalStorage() { clearActiveSessionsFromLocalStorageFunc(this); }

    // modules/ui_management.js
    setSettingsTab(tabName) { setSettingsTabFunc(this, tabName); }
    setSessionState(key, value) { setSessionStateFunc(this, key, value); }
    toggleAutoAdvance() { toggleAutoAdvanceFunc(this); }
    changeLanguage(lang) { changeLanguageFunc(this, lang); }
    attachThemePreviewHandlers() { return attachThemePreviewHandlersFunc(this); }

    // modules/event_handlers.js
    attachKeydownHandlers(screen) { attachKeydownHandlersFunc(this, screen); }

    // modules/post_render_logic.js
    applyPostRenderEffects(screen) { applyPostRenderEffectsFunc(this, screen); }

    // modules/content_renderer.js
    renderAppContent() { return renderAppContentFunc(this); }
    
    // modules/pre_render_logic.js
    applyPreRenderEffects() { return applyPreRenderEffectsFunc(this); }
    
    // --- (ИЗМЕНЕНИЕ) Добавлен делегат для нового модуля ---
    // modules/footer_renderer.js
    renderAppFooter(screen) { renderAppFooterFunc(this, screen); }
    // --- (КОНЕЦ ИЗМЕНЕНИЯ) ---


    // --- ДЕЛЕГИРОВАНИЕ/ОБЁРТКИ (Остальные модули) ---

    // progress.js
    async loadUserProgress() { await loadUserProgressFunc(this); }
    async saveCurrentProfileProgress() { await saveCurrentProfileProgressFunc(this); }
    async completeStage1() { completeStage1Func(this); }
    async completeStage2() { completeStage2Func(this); }
    async finishStage3() { finishStage3Func(this); }
    async resetActiveProfile() { resetActiveProfileFunc(this); }
    calculateTotalScore() { return calculateTotalScoreFunc(this); }
    renderScores() { renderScoresFunc(this); }

    // --- ИЗМЕНЕНИЕ: Делегаты теперь указывают на разные модули ---
    // training.js (и word_selection.js, и training_stage1.js)
    startNewSession() { startNewSessionFunc(this); } // training.js
    continueSession() { continueSessionFunc(this); } // training.js
    selectWord(event, russianWord) { selectWordFunc(this, event, russianWord); } // word_selection.js
    selectAllWords(activeTab = 'words') { selectAllWordsFunc(this, activeTab); } // word_selection.js
    deselectAllWords() { deselectAllWordsFunc(this); } // word_selection.js
    selectCategory(categoryName, select, activeTab = 'words') { selectCategoryFunc(this, categoryName, select, activeTab); } // word_selection.js
    startTraining() { startTrainingFunc(this); } // training_stage1.js
    handleLetterInput(e, isHint = false) { handleLetterInputFunc(this, e, isHint); } // training_stage1.js
    checkWord(isAutoAdvance = false) { checkWordFunc(this, isAutoAdvance); } // training_stage1.js
    showHint(langId) { showHintFunc(this, langId); } // training_stage1.js
    buyHeart() { buyHeartFunc(this); } // training_stage1.js
    startStage2() { startStage2Func(this); } // training_stage2.js
    checkStage2() { checkStage2Func(this); } // training_stage2.js
    showHintStage2() { showHintStage2Func(this); } // training_stage2.js
    startStage3() { startStage3Func(this); } // training.js
    handleStage3Input(e, ruWord) { handleStage3InputFunc(this, e, ruWord); } // training.js
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    // editors.js
    setEditorState(key, value) { setEditorStateFunc(this, key, value); if (key === 'level') sessionStorage.setItem('editorLevel', value); if (key === 'dictType') sessionStorage.setItem('editorDictType', value); }
    applySearch() { applySearchFunc(this); }
    toggleSearchField(field) { toggleSearchFieldFunc(this, field); }
    toggleDictItemSelection(ru, category) { toggleDictItemSelectionFunc(this, ru, category); }
    toggleSelectAll(visibleKeys) { toggleSelectAllFunc(this, visibleKeys); }
    async updateDictionaryWord(oldRu, oldCategory, index) { await updateDictionaryWordFunc(this, oldRu, oldCategory, index); }
    async addDictionaryWord() { await addDictionaryWordFunc(this); }
    async deleteSelected() { await deleteSelectedFunc(this); }
    exportDictionary() { exportDictionaryFunc(this); }
    async importDictionary() { await importDictionaryFunc(this); }
    async loadCustomStory() { await loadCustomStoryFunc(this); }
    async saveStory(storyId) { await saveStoryFunc(this, storyId); }
    async deleteCustomStory(storyId) { await deleteCustomStoryFunc(this, storyId); }

    // theme.js
    async loadAllThemes() { await loadAllThemesFunc(this); }
    applyThemePreview(colorVar, value) { applyThemePreview(colorVar, value); }
    async updateTheme(themeId) { await updateThemeFunc(this, themeId); }
    async activateTheme(themeId) { await activateThemeFunc(this, themeId); }
    async addNewTheme() { await addNewThemeFunc(this); }
    async deleteTheme(themeId) { await deleteThemeFunc(this, themeId); }
    async setUserTheme(themeId) { await setUserThemeFunc(this, themeId); }
    async applyThemeFromServer() { await applyThemeFromServer(this); }

    // settings.js
    getSetting(key) { return getSettingFunc(this, key); }
    setUserSetting(key, value) { setUserSettingFunc(this, key, value); }
    saveSettingsToServer() { saveSettingsToServerFunc(this); }
    applyFontSettings() { applyFontSettingsFunc(this); }

    // app_utils.js
    playSound(options) { playSoundFunc(this, options); }
    playSoundClick() { playSoundClickFunc(this); }
    playSoundFlip() { playSoundFlipFunc(this); }
    playSoundError() { playSoundErrorFunc(this); }
    playSoundCorrect() { playSoundCorrectFunc(this); }
    initAudio() { initAudioFunc(this); }
    initMatrix() { initMatrixFunc(this); }
    stopMatrix() { stopMatrixFunc(this); }
    showEasterEgg(char) { showEasterEggFunc(this, char); }
    focusNextStage3Input() { focusNextStage3InputFunc(); }
    ensureCategorized(d) { return ensureCategorizedFunc(d); }
    mergeDictionariesCategorized(cz, en) { return mergeDictionariesCategorizedFunc(cz, en); }
    toggleAllCategories(open) { toggleAllCategoriesFunc(this, open); }
    showTooltip(e, ...a) { showTooltipFunc(this, e, ...a); }
    hideTooltip() { hideTooltipFunc(); }
    escapeTooltip(s) { return escapeTooltipFunc(s); }
    findContext(searchText, fullText) { return findContextFunc(searchText, fullText); }
    getEmojiProgress(current, total) { return getEmojiProgressFunc(current, total); }

    // --- БАЗОВЫЕ МЕТОДЫ ИНИЦИАЛИЗАЦИИ И НАВИГАЦИИ ---

    async init() {
        console.log("App init started...");
        const setAppHeight = () => {
            document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
        };
        setAppHeight();
        window.addEventListener('resize', setAppHeight);


        const token = localStorage.getItem('token');
        if (token) { this.state.token = token; }

        this.applyFontSettings();
        await this.applyThemeFromServer();
        await this.loadStateAndUser(); // Делегировано в modules/init_and_auth.js
        this.applyFontSettings(); // Повторно применяем шрифты после загрузки настроек

        if (this.getSetting('futuristicView') && !this.matrixInitialized) {
            this.initMatrix();
        }

        if (this.isAdmin()) {
             await this.loadAdminData(); // Делегировано в modules/admin.js
        }
        if (this.state.screen === 'userSettings' && (this.state.settingsActiveTab === 'theme' || this.state.settingsActiveTab === 'admin_theme')) {
             if (!this.state.themeEditorLoaded) {
                 this.loadAllThemes(); // Делегировано в modules/theme.js
             } else {
                 this.render();
             }
        } else if (this.state.screen === 'userSettings' && this.state.settingsActiveTab === 'users' && this.isAdmin()) {
            if (this.state.admin.users.length === 0 && !this.state.admin.isLoadingUsers) {
                 this.loadAdminUsers(); // Делегировано в modules/admin.js
            } else {
                 this.render();
            }
        } else {
             this.render();
        }

        console.log("App init finished.");
    }

    isAdmin() {
        return this.state.user && this.state.user.email === 'admin@example.com';
     }

    async navigateToUserSettings(targetTab = null) {
        return navigateToUserSettingsFunc(this, targetTab); // Делегировано в modules/ui_management.js
    }

    async navigateTo(screen, params = {}) {
        console.log(`Navigating to: ${screen}`, params);
        const oldScreen = this.state.screen;
        this.state.screen = screen;
        sessionStorage.setItem('lastScreen', screen);

        let immediateSavePromise = Promise.resolve();
        const trainingScreens = ['training', 'wordSelection', 'stage2', 'stage3'];
        if (trainingScreens.includes(oldScreen) && screen !== 'profileDashboard') {
             const profile = this.getActiveProfile();
             if (profile?.sessions && profile.language) {
                 const currentSession = profile.sessions[profile.language];
                 if (currentSession && currentSession.autoAdvanceTimerId) {
                     clearTimeout(currentSession.autoAdvanceTimerId);
                     currentSession.autoAdvanceTimerId = null;
                     this.saveActiveSessionsToLocalStorage(); // Делегировано в modules/session_storage.js
                 }
             }
             console.log(`Saving progress immediately before navigating away from ${oldScreen}`);
             immediateSavePromise = this.saveCurrentProfileProgress() // Делегировано в modules/progress.js
                 .catch(err => console.error("Error during immediate progress save on navigation:", err));
        }


        if (screen !== 'userSettings') {
            this.settingsScrollPosition = 0;
        }
        if (screen !== 'dictionaryEditor') { 
            sessionStorage.removeItem('editorLevel'); 
            sessionStorage.removeItem('editorDictType');
            // --- (ИЗМЕНЕНИЕ) Сохраняем позицию скролла редактора при уходе ---
            const editorContainer = document.querySelector('.dict-editor-table')?.parentElement;
            this.scrollPosition = editorContainer ? editorContainer.scrollTop : 0;
        }
        if (screen === 'storyEditor') {
            if (params.storyId !== undefined) { this.state.editor.activeStoryId = params.storyId; sessionStorage.setItem('editorActiveStoryId', params.storyId); }
        } else if (oldScreen === 'storyEditor' && screen !== 'storyEditor') { this.state.editor.activeStoryId = null; sessionStorage.removeItem('editorActiveStoryId'); }
        
        // --- (ИЗМЕНЕНИЕ) Сохраняем позицию скролла выбора слов при уходе ---
        if (oldScreen === 'wordSelection' && screen !== 'wordSelection') {
             const wordSelContainer = document.querySelector('.dictionary-view-container');
             this.scrollPosition = wordSelContainer ? wordSelContainer.scrollTop : 0;
        }


        try {
            await immediateSavePromise;
            console.log("Immediate save operation (if any) completed.");
        } catch (err) {
            console.error("Error during save operation:", err);
        } finally {
            this.render();
        }
     }

    async goHomeAndSave() {
        this.playSoundClick();
        console.log("Global home button clicked. Current screen:", this.state.screen);

        let forceSaveSettingsPromise = Promise.resolve();
        if (this.state.screen === 'userSettings') {
            console.log("Triggering settings save (if pending) before going home...");
            if (this.saveSettingsTimeout) {
                clearTimeout(this.saveSettingsTimeout);
                console.log("Executing pending settings save immediately.");
                const settingsToSave = { ...this.state.settings };
                // Используем прямое API для немедленного сохранения, как и было
                forceSaveSettingsPromise = saveUserSettingsApi(this.state.token, settingsToSave)
                    .then(result => console.log('Настройки пользователя сохранены на сервере (immediate).', result))
                    .catch(error => {
                        console.error('Ошибка при немедленном сохранении настроек на сервере:', error);
                    })
                    .finally(() => { this.saveSettingsTimeout = null; });
            }
        }

        let immediateSaveProgressPromise = Promise.resolve();
        const trainingScreens = ['training', 'wordSelection', 'stage2', 'stage3'];
        if (trainingScreens.includes(this.state.screen)) {
             console.log(`Saving progress immediately on Home click from ${this.state.screen}`);
             immediateSaveProgressPromise = this.saveCurrentProfileProgress() // Делегировано в modules/progress.js
                .catch(err => console.error("Error during immediate progress save on Home click:", err));

            this.clearActiveSessionsFromLocalStorage(); // Делегировано в modules/session_storage.js
            console.log("Local session cleared on Home click.");
        }

        try {
            await Promise.all([immediateSaveProgressPromise, forceSaveSettingsPromise]);
            console.log("Save operations completed (if any). Navigating home.");
        } catch (err) {
            console.error("Error during save operations:", err);
        } finally {
            this.navigateTo('start');
        }
    }

    render() {
        console.log("Rendering screen:", this.state.screen, "Active Tab:", this.state.settingsActiveTab);
        
        // 1. Выполняем всю подготовительную логику
        const currentActualScreen = this.applyPreRenderEffects();

        const appEl = document.getElementById('app');
        if (!appEl) { console.error("Fatal: #app element not found!"); return; }
        
        // 2. Генерируем контент
        const content = this.renderAppContent();

        appEl.innerHTML = content;
        
        // --- (ИЗМЕНЕНИЕ) ---
        // 3. Рендеринг Футера (теперь делегирован)
        this.renderAppFooter(currentActualScreen);
        // --- (КОНЕЦ ИЗМЕНЕНИЯ) ---
        
        // 4. Логика ПОСЛЕ рендеринга
        this.applyPostRenderEffects(currentActualScreen);
        
        // 5. Назначение обработчиков клавиш
        this.attachKeydownHandlers(currentActualScreen);


    } // Конец render()

} // Конец класса App

const app = new App();
window.app = app; // Делаем доступным глобально


