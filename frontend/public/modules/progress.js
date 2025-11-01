// frontend/public/modules/progress.js (ПОЛНЫЙ ОБНОВЛЁННЫЙ КОД v22.9)
// --- ИЗМЕНЕНИЕ: Удалена функция saveProgressToServerDebounced ---
// --- ИЗМЕНЕНИЕ: startNewSession больше не сбрасывает очки ---

import { saveUserProgress, loadUserProgressApi } from '../api.js';

/**
 * Загружает прогресс пользователя с сервера.
 * @param {App} appInstance
 * @returns {Promise<boolean>}
 */
export async function loadUserProgress(appInstance) {
    if (!appInstance.state.token) return false;
    try {
        appInstance.state.progress = await loadUserProgressApi(appInstance.state.token);
        console.log('Прогресс пользователя успешно загружен.');
        // Инициализация пустых сессий, если их нет
        for (const profileKey in appInstance.state.progress) {
             if (!appInstance.state.progress[profileKey].sessions) {
                 appInstance.state.progress[profileKey].sessions = { czech: null, english: null, bilingual: null };
             }
             // --- ДОБАВЛЕНО: Инициализация очков, если их нет ---
             if (!appInstance.state.progress[profileKey].progress) {
                  appInstance.state.progress[profileKey].progress = { czech: {}, english: {}, bilingual: {} };
             }
             ['czech', 'english', 'bilingual'].forEach(lang => {
                 if (!appInstance.state.progress[profileKey].progress[lang]) {
                    appInstance.state.progress[profileKey].progress[lang] = { correctLetters: 0, errorLetters: 0 };
                 }
                 if (appInstance.state.progress[profileKey].progress[lang].correctLetters === undefined) {
                     appInstance.state.progress[profileKey].progress[lang].correctLetters = 0;
                 }
                 if (appInstance.state.progress[profileKey].progress[lang].errorLetters === undefined) {
                      appInstance.state.progress[profileKey].progress[lang].errorLetters = 0;
                 }
             });
             // --- КОНЕЦ ДОБАВЛЕНИЯ ---
        }
        return true;
    } catch (error) {
        console.error('Ошибка при загрузке прогресса:', error);
        appInstance.state.progress = {};
        return false;
    }
}

/**
 * Сохраняет прогресс активного профиля на сервере (Немедленно).
 * Отправляет копию данных без временных полей сессии (Set и т.д.).
 * @param {App} appInstance
 */
export async function saveCurrentProfileProgress(appInstance) {
    if (!appInstance.state.token || !appInstance.state.activeProfileId) return;
    const profileKey = appInstance.state.activeProfileId;
    let progressDataToSend = appInstance.state.progress[profileKey];
    if (!progressDataToSend) return;

    try {
        // Создаем глубокую копию для отправки, чтобы не изменять оригинальный state
        progressDataToSend = JSON.parse(JSON.stringify(progressDataToSend));

        // Удаляем временные данные сессии, которые не должны храниться в БД
        if (progressDataToSend.sessions) {
            for (const lang in progressDataToSend.sessions) {
                const session = progressDataToSend.sessions[lang];
                if (session && typeof session === 'object') {
                    // Удаляем данные, специфичные для localStorage/runtime
                    delete session.seenWords; // Set преобразуется в {} при JSON.stringify
                    delete session.usedHints;  // Set преобразуется в {} при JSON.stringify
                    delete session.autoAdvanceTimerId; // Не нужно в БД
                }
            }
        }

        await saveUserProgress(appInstance.state.token, profileKey, progressDataToSend);
        console.log(`Прогресс для профиля '${profileKey}' успешно сохранён на сервере.`);
    } catch (error) {
        console.error('Ошибка при сохранении прогресса на сервере:', error);
        // Не показываем alert здесь, чтобы не мешать пользователю при автосохранении
    }
}

// --- ИЗМЕНЕНИЕ: Удалена функция saveProgressToServerDebounced ---
// export function saveProgressToServerDebounced(appInstance) { ... }
// --- КОНЕЦ ИЗМЕНЕНИЯ ---


/**
 * Завершает Этап 1, очищает сессию в state и localStorage, сохраняет прогресс в БД.
 * @param {App} appInstance
 */
export async function completeStage1(appInstance) {
    const profile = appInstance.getActiveProfile(); if (!profile) return;
    const s = profile.sessions[profile.language]; const lang = profile.language;
    if (s?.autoAdvanceTimerId) { clearTimeout(s.autoAdvanceTimerId); s.autoAdvanceTimerId = null; }

    const p = profile.progress[lang] || {};
    if (s && s.selectedWords.length > 0) {
        // Только если этап еще не был пройден, показываем alert
        if (!p.stage1Complete) {
            alert(`Этап 1 пройден! Выучено ${s.selectedWords.length} слов/фраз.`);
        }
        p.stage1Complete = true;
        // Добавляем выученные слова, избегая дубликатов
        p.learnedWords = [...new Set([...(p.learnedWords || []), ...s.selectedWords])];
    } else if (!p.stage1Complete) {
         // Если этап не пройден и слов не было/не выбрано
         alert('Тренировка завершена (или не было выбрано слов).');
         p.stage1Complete = false; // Явно ставим false, если слов не было
    }
    profile.progress[lang] = p;

    // Очищаем сессию в state
    if(profile.sessions) profile.sessions[lang] = null;

    // Очищаем localStorage для этого профиля
    appInstance.clearActiveSessionsFromLocalStorage();

    // Сохраняем null сессию и stage1Complete=true/false в БД (немедленно)
    await saveCurrentProfileProgress(appInstance);
    appInstance.navigateTo('profileDashboard');
}

/**
 * Завершает Этап 2, очищает сессию в state и localStorage, сохраняет прогресс в БД.
 * @param {App} appInstance
 */
export async function completeStage2(appInstance) {
    const profile = appInstance.getActiveProfile(); if (!profile) return;
    const lang = profile.language; const s = profile.sessions[lang];
    if (!s) { appInstance.navigateTo('profileDashboard'); return; } // Если сессии уже нет, просто уходим

    if (!profile.progress[lang]) profile.progress[lang] = {};
    const p = profile.progress[lang];

    if (s.failedDueToNoHearts) {
        p.stage2Failed = true;
        p.stage2Complete = false;
        alert('Этап не пройден, так как закончились все сердечки. Попробуйте снова!');
    } else {
        if (!p.stage2Complete) { // Показываем alert только при первом прохождении
             alert('Супер-игра пройдена! Отличная работа!');
        }
        p.stage2Complete = true;
        p.stage2Failed = false; // Сбрасываем флаг провала, если прошли успешно
    }

    // Очищаем сессию в state
    profile.sessions[lang] = null;

    // Очищаем localStorage
    appInstance.clearActiveSessionsFromLocalStorage();

    // Сохраняем null сессию и stage2Complete/Failed в БД (немедленно)
    await saveCurrentProfileProgress(appInstance);
    appInstance.navigateTo('profileDashboard');
}

/**
 * Завершает Этап 3, очищает сессию(и) в state и localStorage, сохраняет прогресс в БД.
 * @param {App} appInstance
 */
export async function finishStage3(appInstance) {
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile(); if (!profile) return;
    const lang = profile.language;

    if (!profile.progress[lang]) profile.progress[lang] = {};
    const p = profile.progress[lang];
    p.stage3Complete = true;
    p.stage3Failed = false; // Сбрасываем флаг провала

    // Очищаем сессию для текущего языка в state
    if (profile.sessions) profile.sessions[lang] = null;

    // Проверяем, пройдены ли все языковые режимы
    const allModesComplete = profile.progress.czech?.stage3Complete &&
                             profile.progress.english?.stage3Complete &&
                             profile.progress.bilingual?.stage3Complete;

    if (allModesComplete) {
        // Если все режимы пройдены, очищаем ВСЕ сессии в state (на всякий случай)
        profile.sessions = { czech: null, english: null, bilingual: null };
    }

    // Очищаем localStorage для текущего профиля (он больше не нужен)
    appInstance.clearActiveSessionsFromLocalStorage();

    // Сохраняем null сессию(и) и stage3Complete в БД (немедленно)
    await saveCurrentProfileProgress(appInstance);

    // Переходим на соответствующий экран завершения
    appInstance.navigateTo(allModesComplete ? 'globalCompletion' : 'completion');
}

/**
 * Сбрасывает прогресс активного профиля в state, localStorage и БД.
 * @param {App} appInstance
 */
export async function resetActiveProfile(appInstance) {
    appInstance.playSoundClick();
    if (confirm('Вы уверены? Это сбросит весь прогресс для ТЕКУЩЕГО ПРОФИЛЯ (локально и на сервере).')) {
        const profileId = appInstance.state.activeProfileId;
        if (profileId && appInstance.state.progress) {
            try {
                // Отправляем дефолтное состояние в БД (где sessions тоже null)
                await saveUserProgress(appInstance.state.token, profileId, appInstance.defaultProfileState);
                console.log(`Прогресс для профиля '${profileId}' сброшен на сервере.`);

                // Удаляем прогресс из локального state
                // delete appInstance.state.progress[profileId]; // Не удаляем, а сбрасываем, чтобы объект остался
                appInstance.state.progress[profileId] = JSON.parse(JSON.stringify(appInstance.defaultProfileState));

                // Очищаем сессию из localStorage
                appInstance.clearActiveSessionsFromLocalStorage();

                // Очищаем сохраненный язык дашборда для этого профиля
                sessionStorage.removeItem('dashboardLanguage');

                appInstance.render(); // Перерисовываем (скорее всего, останется на дашборде, но сброшенном)

            } catch(error) {
                 console.error('Ошибка при сбросе прогресса на сервере:', error);
                 alert("Не удалось сбросить прогресс на сервере. Попробуйте еще раз.");
            }
        } else {
             // Если профиля нет в state, просто очищаем localStorage на всякий случай
             appInstance.clearActiveSessionsFromLocalStorage();
             sessionStorage.removeItem('dashboardLanguage');
             appInstance.render(); // Перерисовываем (вероятно, на выбор профиля)
        }
    }
}

/**
 * Вычисляет общий счет пользователя по всем профилям.
 * @param {App} appInstance
 * @returns {number}
 */
export function calculateTotalScore(appInstance) {
    if (!appInstance.state.progress) return 0;
    return Object.values(appInstance.state.progress).reduce((total, profile) => {
        const p = profile?.progress; // p может быть undefined
        if (!p) return total;
        // Суммируем очки по всем языкам внутри профиля
        const correct = (p.czech?.correctLetters || 0) + (p.english?.correctLetters || 0) + (p.bilingual?.correctLetters || 0);
        const errors = (p.czech?.errorLetters || 0) + (p.english?.errorLetters || 0) + (p.bilingual?.errorLetters || 0);
        return total + Math.max(0, correct - errors);
    }, 0);
}

/**
 * Обновляет отображение очков на экране (глобальный счет и счет для текущего языка).
 * @param {App} appInstance
 */
export function renderScores(appInstance) {
    const profile = appInstance.getActiveProfile();
    // Обновляем глобальный счет
    const globalScoreEl = document.querySelector('.global-score-display .score-value');
    if (globalScoreEl) { globalScoreEl.textContent = calculateTotalScore(appInstance); }

    // Обновляем счет для текущего языка, если профиль активен
    if (profile) {
        const langData = profile.progress?.[profile.language] || { correctLetters: 0, errorLetters: 0 };
        // --- ИСПРАВЛЕНИЕ: Убедимся, что значения - числа ---
        const correct = Number(langData.correctLetters) || 0;
        const errors = Number(langData.errorLetters) || 0;
        const langScoreHTML = `<span>Правильно: ${correct}</span> | <span>Ошибок: ${errors}</span>`;
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        document.querySelectorAll('.score-display, .training-score-display').forEach(el => {
            el.innerHTML = langScoreHTML;
        });
    } else {
         // Если профиль не активен, очищаем локальные очки
         document.querySelectorAll('.score-display, .training-score-display').forEach(el => {
             el.innerHTML = '<span>Правильно: 0</span> | <span>Ошибок: 0</span>';
         });
    }
}

