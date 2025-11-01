// frontend/public/modules/settings.js (v20.28)
// --- ИЗМЕНЕНИЕ: Добавлена обработка easterEggFontSize ---

import { saveUserSettingsApi } from '../api.js';

/**
 * Читает настройку из state, используя дефолт, если state еще не загружен.
 * @param {App} appInstance
 * @param {string} key
 * @returns {*}
 */
export function getSetting(appInstance, key) {
    //
    return appInstance.state.settings?.[key] ?? appInstance.defaultSettings[key];
}

/**
 * Устанавливает настройку пользователя и запускает отложенное сохранение.
 * @param {App} appInstance
 * @param {string} key
 * @param {*} value
 */
export function setUserSetting(appInstance, key, value) {
    appInstance.playSoundClick();
    console.log(`Setting user setting: ${key} =`, value);
    if (!appInstance.state.settings) {
        console.warn("State settings missing, initializing with defaults.");
        appInstance.state.settings = { ...appInstance.defaultSettings };
    }

    // <<< ОБНОВЛЕННЫЙ СПИСОК ЧИСЛОВЫХ НАСТРОЕК >>>
    const numericSettings = ['repetitions', 'autoAdvanceDelay', 'minWords', 'easterEggTrigger1', 'easterEggTrigger2', 'easterEggCycleLength'];
    // <<< СПИСОК НАСТРОЕК С 'px' >>>
    const pxSettings = ['globalFontSize', 'easterEggFontSize'];
    let processedValue;

    // Обработка разных типов значений
    if (typeof value === 'boolean') {
        processedValue = value;
    } else if (numericSettings.includes(key)) {
         const numValue = parseInt(value, 10);
         processedValue = (!isNaN(numValue) && numValue >= 0) ? numValue : appInstance.defaultSettings[key];
    // <<< НОВАЯ ОБРАБОТКА ДЛЯ 'px' НАСТРОЕК >>>
    } else if (pxSettings.includes(key)) {
         processedValue = String(value).endsWith('px')
             ? String(value)
             : `${parseInt(value, 10) || parseInt(appInstance.defaultSettings[key], 10)}px`;
    } else { // Строки (семейство шрифтов, эмодзи)
        processedValue = String(value);
    }

    // Обновляем state немедленно
    appInstance.state.settings[key] = processedValue;
    console.log("Updated state.settings:", appInstance.state.settings);


    // Применяем шрифты сразу, если они изменились
    if (key === 'globalFontSize' || key === 'globalFontFamily') {
        applyFontSettings(appInstance);
    }
    // --- УДАЛЕНО: Применение размера пасхалки здесь больше не нужно ---
    // if (key === 'easterEggFontSize') {
    //     // Применяем размер пасхалки (если элемент существует)
    //     applyEasterEggSizePreview(processedValue); // Используем обработанное значение
    // }

    // Вызываем отложенное сохранение ВСЕХ настроек на сервере
    saveSettingsToServer(appInstance);

    // Перерисовываем UI, если нужно (например, для futuristicView)
    if (key === 'futuristicView' || (appInstance.state.screen === 'userSettings' && appInstance.state.settingsActiveTab === 'general') ) {
         appInstance.render();
    }
    // Для вкладки пасхалок ререндер не нужен, так как ползунок сам обновляет label
}

/**
 * Запускает отложенное сохранение настроек на сервере.
 * @param {App} appInstance
 */
export function saveSettingsToServer(appInstance) {
    if (!appInstance.state.token) { console.warn("Cannot save settings: no token."); return; }
    if (!appInstance.state.settings) { console.warn("Cannot save settings: state.settings is missing."); return; }

    console.log("Scheduling settings save...");
    if (appInstance.saveSettingsTimeout) {
        clearTimeout(appInstance.saveSettingsTimeout);
    }

    const settingsToSave = { ...appInstance.state.settings };

    appInstance.saveSettingsTimeout = setTimeout(async () => {
        try {
            console.log("Executing delayed settings save with:", settingsToSave);
            const result = await saveUserSettingsApi(appInstance.state.token, settingsToSave);
            console.log('Настройки пользователя сохранены на сервере.', result);
        } catch (error) {
            console.error('Ошибка при сохранении настроек на сервере:', error);
             alert('Не удалось сохранить настройки. Попробуйте еще раз.');
        } finally {
             appInstance.saveSettingsTimeout = null;
        }
    }, 1500); // Задержка 1.5 сек
}

/**
 * Применяет глобальные настройки шрифтов из state к DOM.
 * @param {App} appInstance
 */
export function applyFontSettings(appInstance) {
    //
    const fontSize = appInstance.state.settings?.globalFontSize || appInstance.defaultSettings.globalFontSize;
    const fontFamily = appInstance.state.settings?.globalFontFamily || appInstance.defaultSettings.globalFontFamily;
    console.log("Applying font settings:", fontSize, fontFamily);
    document.documentElement.style.setProperty('--global-font-size', fontSize);
    document.documentElement.style.setProperty('--global-font-family', fontFamily);
}

// --- УДАЛЕНО: Эта функция больше не нужна, т.к. размер применяется в app_utils.js ---
// /**
//  * Применяет размер шрифта к элементу пасхалки для предпросмотра.
//  * @param {string} size
//  */
// function applyEasterEggSizePreview(size) {
//     const el = document.getElementById('easter-egg');
//     if (el) {
//         el.style.fontSize = size;
//     }
// }
