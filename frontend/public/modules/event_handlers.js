// frontend/public/modules/event_handlers.js
// Этот модуль содержит логику для назначения глобальных обработчиков событий (например, нажатий клавиш),
// которые зависят от текущего экрана.

/**
 * Назначает глобальные обработчики нажатий клавиш (document.onkeydown)
 * в зависимости от текущего экрана.
 * @param {App} appInstance - Экземпляр App.
 * @param {string} currentActualScreen - Название экрана, который рендерится.
 */
export function attachKeydownHandlers(appInstance, currentActualScreen) {
    // Очищаем предыдущий обработчик
    document.onkeydown = null;

    // Сбрасываем счетчики Enter, которые могли остаться
    if (appInstance.enterConfirmTimeout) {
        clearTimeout(appInstance.enterConfirmTimeout);
        appInstance.enterConfirmTimeout = null;
    }
    appInstance.enterPressCount = 0;
    appInstance.dashboardEnterCount = 0;


    // Назначаем новый обработчик в зависимости от экрана
    if (currentActualScreen === 'completion' || currentActualScreen === 'globalCompletion') {
         document.onkeydown = (e) => {
             if (e.key === 'Enter') appInstance.navigateTo('profileDashboard');
         };
    } else if (currentActualScreen === 'training') {
         // --- Этап 1: Тренировка ---
         setTimeout(() => document.querySelector('.letter-input:not(:disabled)')?.focus(), 100);
         document.onkeydown = (e) => {
             if (e.key !== 'Enter') return;
             const target = e.target;
             // Игнорируем Enter, если фокус на кнопке "В меню профиля"
             if (target.matches('button[onclick="app.navigateTo(\'profileDashboard\')"]')) return;
             e.preventDefault();
             appInstance.checkWord(); // Вызываем проверку слова
         };
    } else if (currentActualScreen === 'stage2') {
         // --- Этап 2: Супер-игра ---
         setTimeout(() => document.querySelector('.super-game-input:not([readonly])')?.focus(), 100);
         document.onkeydown = (e) => {
             if (e.key !== 'Enter') return;
             const target = e.target;
             // Игнорируем Enter, если фокус на кнопке "В меню профиля"
             if (target.matches('button[onclick="app.navigateTo(\'profileDashboard\')"]')) return;
             e.preventDefault();
             appInstance.checkStage2(); // Вызываем проверку
         };
    } else if (currentActualScreen === 'stage3') {
        // --- Этап 3: Контекст ---
        appInstance.focusNextStage3Input(); // Фокус на первое поле
         document.onkeydown = (e) => {
             const target = e.target;
             // Игнорируем Enter на кнопке "В меню"
             if (e.key === 'Enter' && target.matches('button[onclick="app.navigateTo(\'profileDashboard\')"]')) return;

             // Если фокус в поле ввода
             if (target.classList.contains('context-input')) {
                 if (e.key === 'Enter') {
                     e.preventDefault();
                     if (target.value.trim() === '') { appInstance.playSoundError(); }
                     else {
                         target.blur(); // Теряем фокус (чтобы сработал onchange)
                         appInstance.focusNextStage3Input(); // Фокус на следующее поле
                     }
                 }
                 return;
             }

             // Логика "двойного Enter" для кнопки "Завершить"
             if (e.key !== 'Enter') {
                appInstance.enterPressCount = 0;
                const fb = document.querySelector('#finish-stage3-btn');
                if (fb && fb.textContent !== 'Завершить') { fb.textContent = 'Завершить'; }
                return;
             }

             // Если нажат Enter (и не в поле ввода)
             if (target.matches('#finish-stage3-btn') || target === document.body) {
                 const finishButton = document.querySelector('#finish-stage3-btn');
                 if (finishButton && !finishButton.disabled) { // Если кнопка активна
                     e.preventDefault();
                     appInstance.enterPressCount++;
                     if (appInstance.enterPressCount === 1) {
                        finishButton.textContent = 'Подтвердите (Enter)';
                        if(appInstance.enterConfirmTimeout) clearTimeout(appInstance.enterConfirmTimeout);
                        appInstance.enterConfirmTimeout = setTimeout(() => {
                            // Проверяем, что мы все еще на экране Этапа 3
                            const currentScreenCheck = appInstance.getActiveProfile()?.sessions?.[appInstance.getActiveProfile()?.language]?.screen;
                            const currentButton = document.querySelector('#finish-stage3-btn');
                            if (currentScreenCheck === 'stage3' && currentButton) {
                                currentButton.textContent = 'Завершить';
                            }
                            appInstance.enterPressCount = 0;
                            appInstance.enterConfirmTimeout = null;
                        }, 2500);
                     } else if (appInstance.enterPressCount === 2) {
                        clearTimeout(appInstance.enterConfirmTimeout);
                        appInstance.enterConfirmTimeout = null;
                        appInstance.enterPressCount = 0;
                        appInstance.finishStage3(); // Завершаем
                     }
                 } else {
                      e.preventDefault(); // Игнорируем Enter, если кнопка неактивна
                 }
             } else {
                 e.preventDefault(); // Игнорируем Enter в других случаях
             }
         };
    } else if (currentActualScreen === 'profileDashboard') {
        // --- Дашборд ---
        appInstance.dashboardEnterCount = 0;
         document.onkeydown = (e) => {
             if (e.key !== 'Enter') {
                 appInstance.dashboardEnterCount = 0;
                 return;
             }
             e.preventDefault();
             const isMaster = !!document.querySelector('.completion-banner');
             if (isMaster) {
                 // Пасхалка "Мастер профиля"
                 appInstance.dashboardEnterCount++;
                 const masterEmoji1 = appInstance.getSetting('masterEmoji1') || '🎉';
                 const masterEmoji2 = appInstance.getSetting('masterEmoji2') || '🥳';
                 const masterEmoji3 = appInstance.getSetting('masterEmoji3') || '🎊';
                 if (appInstance.dashboardEnterCount % 3 === 1) appInstance.showEasterEgg(masterEmoji1);
                 else if (appInstance.dashboardEnterCount % 3 === 2) appInstance.showEasterEgg(masterEmoji2);
                 else appInstance.showEasterEgg(masterEmoji3);
             } else {
                 // "Умный" Enter на дашборде
                 const focusedLangButton = document.querySelector('.language-switcher button.needs-attention');
                 if (focusedLangButton) {
                     focusedLangButton.click(); // 1. Переключить язык
                     return;
                 }
                 const focusedStageCard = document.querySelector('.stage-card.focused-card');
                 if (focusedStageCard) {
                     // 2. Нажать "Продолжить" или "Начать" на подсвеченном этапе
                     const continueButton = focusedStageCard.querySelector('.button[onclick="app.continueSession()"]');
                     const startButton = focusedStageCard.querySelector('.button.secondary[onclick^="app.start"]');
                     if (continueButton) {
                         continueButton.click();
                     } else if (startButton) {
                         startButton.click();
                     }
                     return;
                 }
                 // 3. По умолчанию начать Этап 1
                 const stage1StartButton = document.querySelector('.stage-card:first-child .button.secondary[onclick="app.startNewSession()"]');
                 if (stage1StartButton) {
                      stage1StartButton.click();
                 }
             }
         };
    }
    // Для остальных экранов (start, profileSelection, userSettings и т.д.)
    // document.onkeydown остается null (стандартное поведение браузера)
}
