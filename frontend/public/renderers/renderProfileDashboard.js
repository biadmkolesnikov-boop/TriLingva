// frontend/public/renderers/renderProfileDashboard.js
// (Этот файл содержит функцию рендеринга для дашборда профиля)

export function renderProfileDashboard(appInstance, state) {
     // Рендерит дашборд для выбранного профиля обучения
     const profile = appInstance.getActiveProfile();
     // Если профиль еще не загружен или не выбран, перенаправляем
     if (!profile) {
         appInstance.navigateTo('profileSelection');
         return `<h1>Загрузка профиля...</h1>`; // Временное сообщение
     }
     const lang = profile.language; // Текущий язык ('czech', 'english', 'bilingual')
     const langData = profile.progress[lang] || {}; // Прогресс для текущего языка
     const session = profile.sessions[lang]; // Активная сессия для текущего языка
     const profileData = appInstance.activeData; // Данные профиля (название, словари/тексты)
     let allCompleteBanner = ''; // Баннер "Мастер профиля"

     // Проверяем, пройдены ли все 3 этапа для всех 3 языковых режимов
     const p = profile.progress;
     if (p.czech?.stage3Complete && p.english?.stage3Complete && p.bilingual?.stage3Complete) {
         allCompleteBanner = `<div class="completion-banner"><h2>🏆 Мастер профиля! 🏆</h2><p>Ты полностью прошёл все языковые режимы для этого профиля. <br>Можно <a href="#" onclick="event.preventDefault(); app.resetActiveProfile();">начать сначала</a> или выбрать другой профиль.</p></div>`;
     }
     // Информация об активных сессиях (если есть незавершенные)
     const activeSessionsCount = Object.values(profile.sessions).filter(s => s !== null).length;
     let activeSessionsInfo = activeSessionsCount > 0 ? `<div class="active-sessions-info">Запущено сессий: ${activeSessionsCount}</div>` : '';

     // Функция для отображения статуса этапа (пройдено, провалено, доступно)
     const getBadge = (complete, failed, available) => {
        if (complete) return '<div class="completed-badge gold">⭐ Завершено</div>';
        if (failed) return '<div class="completed-badge failed">💔 Повторить</div>'; // Если провалено (Этап 2)
        if (available) return '<div class="completed-badge available">✔ Доступно</div>'; // Если доступно, но не пройдено
        return ''; // Если еще не доступно
     };
     // Отображение очков для текущего языка
     const scoreHTML = `<span>Правильно: ${langData.correctLetters || 0}</span> | <span>Ошибок: ${langData.errorLetters || 0}</span>`;

     // Определяем, показывать ли кнопки "Продолжить" для каждого этапа
     const showContinue1 = session && (session.screen === 'wordSelection' || session.screen === 'training');
     const showContinue2 = session && session.screen === 'stage2';
     const showContinue3 = session && session.screen === 'stage3';

     // Определяем, разблокированы ли Этапы 2 и 3
     const stage2Unlocked = profile.progress[lang]?.stage1Complete;
     const stage3Unlocked = profile.progress[lang]?.stage2Complete;

     // Логика для подсветки карточки этапа/языка, на который стоит обратить внимание
     let focusStage1 = false, focusStage2 = false, focusStage3 = false, nextLang = null;
     if (!langData.stage1Complete) { focusStage1 = true; } // Фокус на Этап 1, если он не пройден
     else if (!langData.stage2Complete && !langData.stage2Failed) { focusStage2 = true; } // Фокус на Этап 2, если он доступен и не пройден/провален
     else if (!langData.stage3Complete && !langData.stage3Failed) { focusStage3 = true; } // Фокус на Этап 3
     else if (langData.stage2Failed) { focusStage2 = true; } // Фокус на Этап 2, если он провален
     else if (langData.stage3Failed) { focusStage3 = true; } // Фокус на Этап 3, если он провален
     else { // Если все этапы для текущего языка пройдены, ищем следующий непройденный язык
        const langOrder = ['czech', 'english', 'bilingual'];
        for (const next of langOrder) {
             if (next !== lang && !(profile.progress[next] && profile.progress[next].stage3Complete)) {
                 nextLang = next; // Нашли следующий язык для прохождения
                 break;
             }
        }
     }

     return `<div class="global-score-display">Общий счёт<div class="score-value">${appInstance.calculateTotalScore()}</div></div>
            <h1>${profileData.name}</h1>${allCompleteBanner}
            <div class="language-switcher">
                <button class="${lang === 'czech' ? 'active' : ''} ${nextLang === 'czech' ? 'needs-attention' : ''}" onclick="app.changeLanguage('czech')">Чешский</button>
                <button class="${lang === 'english' ? 'active' : ''} ${nextLang === 'english' ? 'needs-attention' : ''}" onclick="app.changeLanguage('english')">Английский</button>
                <button class="${lang === 'bilingual' ? 'active' : ''} ${nextLang === 'bilingual' ? 'needs-attention' : ''}" onclick="app.changeLanguage('bilingual')">Билингвальный</button>
             </div>
             ${activeSessionsInfo}
             <div class="stage-cards">
                 <div class="stage-card ${focusStage1 ? 'focused-card' : ''}">${langData.stage1Complete ? '<div class="completed-badge">✔ Пройдено</div>' : ''}<h2>Этап 1: Изучение слов</h2><div class="score-display">${scoreHTML}</div><div class="stage-card-buttons">${showContinue1 ? `<button class="button" onclick="app.continueSession()">☁️ Продолжить</button><button class="button secondary" onclick="app.startNewSession()">Начать заново</button>` : `<button class="button secondary" onclick="app.startNewSession()">Начать</button>`}</div></div>
                 <div class="stage-card ${!stage2Unlocked ? 'disabled' : ''} ${focusStage2 ? 'focused-card' : ''}">${getBadge(langData.stage2Complete, langData.stage2Failed, stage2Unlocked)}<h2>Этап 2: Супер-игра</h2><div class="stage-card-buttons">${showContinue2 ? `<button class="button" onclick="app.continueSession()">☁️ Продолжить</button>` : (stage2Unlocked ? `<button class="button secondary" onclick="app.startStage2()">Начать</button>` : '')}</div></div>
                 <div class="stage-card ${!stage3Unlocked ? 'disabled' : ''} ${focusStage3 ? 'focused-card' : ''}">${getBadge(langData.stage3Complete, langData.stage3Failed, stage3Unlocked)}<h2>Этап 3: Практика в контексте</h2><div class="stage-card-buttons">${showContinue3 ? `<button class="button" onclick="app.continueSession()">☁️ Продолжить</button>` : (stage3Unlocked ? `<button class="button secondary" onclick="app.startStage3()">Начать</button>` : '')}</div></div>
             </div>
             <div style="text-align: center; margin-top: 20px; display:flex; flex-wrap: wrap; justify-content:center; gap: 10px;">
                 <button class="button secondary small" onclick="app.navigateTo('profileSelection')">Выбор профиля</button>
                 <button class="button secondary small" onclick="app.resetActiveProfile()">Сбросить прогресс</button>
             </div>`;
}
