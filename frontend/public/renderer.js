// frontend/public/renderer.js
// (Этот файл импортирует и экспортирует все функции рендеринга)

// --- Импорт рендеров для Экранов ---
import { renderLogin } from './renderers/renderLogin.js';
import { renderStart } from './renderers/renderStart.js';
import { renderProfileSelection } from './renderers/renderProfileSelection.js';
import { renderProfileDashboard } from './renderers/renderProfileDashboard.js';
import { renderUserSettings } from './renderers/renderUserSettings.js';
import { renderWordSelection } from './renderers/renderWordSelection.js';
import { renderTraining } from './renderers/renderTraining.js';
import { renderStage2 } from './renderers/renderStage2.js';
import { renderStage3 } from './renderers/renderStage3.js';
import { renderCompletion } from './renderers/renderCompletion.js';
import { renderGlobalCompletion } from './renderers/renderGlobalCompletion.js';
import { renderAbout } from './renderers/renderAbout.js';
import { renderFooter } from './renderers/renderFooter.js';
import { renderDictionaryEditor } from './renderers/renderDictionaryEditor.js';
import { renderStoryEditor } from './renderers/renderStoryEditor.js';

// --- Импорт рендеров для вкладок Настроек (они уже используются в renderUserSettings) ---
// (Нам не нужно их экспортировать, так как они импортируются напрямую в renderUserSettings.js)
// import { renderGeneralSettings } from './renderers/settings/renderGeneralSettings.js';
// import { renderThemeAndFontSettings } from './renderers/settings/renderThemeAndFontSettings.js';
// ... и т.д.

// --- Главный экспорт ---
// Экспортируем все импортированные функции, чтобы main.js мог их использовать
export {
    renderLogin,
    renderStart,
    renderProfileSelection,
    renderProfileDashboard,
    renderUserSettings,
    renderWordSelection,
    renderTraining,
    renderStage2,
    renderStage3,
    renderCompletion,
    renderGlobalCompletion,
    renderAbout,
    renderFooter,
    renderDictionaryEditor,
    renderStoryEditor
};
