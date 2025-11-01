// frontend/public/renderers/renderStage2.js
// (Этот файл содержит функцию рендеринга для Этапа 2 - Супер-игра)

export function renderStage2(appInstance, state) {
     // Рендерит экран Этапа 2 (супер-игра)
     const profile = appInstance.getActiveProfile();
     const s = profile?.sessions?.[profile.language];
     if (!s || !s.tasks || s.tasks.length === 0) {
        console.warn("Нет сессии или заданий в renderStage2");
        appInstance.navigateTo('profileDashboard');
        return `<h1>Загрузка...</h1>`;
     }

     const task = s.tasks[s.currentTaskIndex];
     const progressText = `Задание ${s.currentTaskIndex + 1} из ${s.tasks.length}`;
     let inputHTML = '', wordToShow = '';
     let heartsDisplay = s.heartsLeft > 0 ? '♥'.repeat(s.heartsLeft) : '<div class="hearts-out-message">Сердечки кончились!</div>';
     if (s.heartsLeft <= 0) { heartsDisplay += `<button class="button secondary small" style="margin-top:10px;" onclick="app.startStage2()">Начать снова</button>`; }

     switch (task.type) {
         case 'cz_to_others':
             wordToShow = `<div class="foreign-word">${task.cz}</div><span class="language-label">(Чешский)</span>`;
             inputHTML = `<div class="super-game-bilingual-group"><label>Русский (для справки)</label><input type="text" value="${task.ru}" class="super-game-input" readonly></div>
                          <div class="super-game-bilingual-group"><label>Английский</label><input type="text" id="super-game-input-en" class="super-game-input"></div>`;
             break;
         case 'en_to_others':
             wordToShow = `<div class="foreign-word">${task.en}</div><span class="language-label">(Английский)</span>`;
             inputHTML = `<div class="super-game-bilingual-group"><label>Русский (для справки)</label><input type="text" value="${task.ru}" class="super-game-input" readonly></div>
                          <div class="super-game-bilingual-group"><label>Чешский</label><input type="text" id="super-game-input-cz" class="super-game-input"></div>`;
             break;
         case 'forward':
             const langNameFwd = profile.language === 'czech' ? 'на чешский' : 'на английский';
             wordToShow = `<div class="russian-word">${task.ru}</div>`;
             inputHTML = `<input type="text" id="super-game-input" class="super-game-input" placeholder="Введите перевод ${langNameFwd}">`;
             break;
         case 'reverse':
             wordToShow = `<div class="foreign-word">${task.foreign}</div>`;
             inputHTML = `<input type="text" id="super-game-input" class="super-game-input" placeholder="Введите перевод на русский">`;
             break;
     }

     const canBuyHeart = s.heartsLeft < 7 && appInstance.calculateTotalScore() >= 2;

     return `<h1>Этап 2: Супер-игра</h1>
             <div class="progress-indicator">${progressText}</div>
             <div class="card-training">
                 <div class="hearts-container">${heartsDisplay}</div>
                 <div class="buy-heart-container">
                     <span>Общий счёт: ${appInstance.calculateTotalScore()}</span>
                     <button class="button small" onclick="app.buyHeart()" ${!canBuyHeart ? 'disabled' : ''}>Купить ❤️ (2 очка)</button>
                 </div>
                 ${wordToShow}
                 ${inputHTML}
                 <div style="margin-top:20px; display:flex; gap:10px; justify-content: center;">
                     <button class="button" onclick="app.checkStage2()">Проверить (Enter)</button>
                     <button class="button secondary" onclick="app.showHintStage2()" ${s.heartsLeft === 0 ? 'disabled' : ''}>Подсказка</button>
                 </div>
                 <button class="button secondary" style="margin-top:10px; max-width: 300px;" onclick="app.navigateTo('profileDashboard')">В меню профиля</button>
             </div>`;
}
