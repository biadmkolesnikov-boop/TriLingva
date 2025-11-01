// frontend/public/renderers/renderGlobalCompletion.js
// (Этот файл содержит функцию рендеринга для экрана "Мастер профиля")

export function renderGlobalCompletion(appInstance, state) {
     // Рендерит экран "Мастер профиля" (после Этапа 3, если все языки завершены)
     setTimeout(() => {appInstance.playSound({frequency: 1500, duration: 0.7, type: 'sine'});}, 100);
     const profile = appInstance.getActiveProfile();

     // Очищаем ВСЕ сессии для этого профиля
     if (profile && profile.sessions) {
         profile.sessions = {czech: null, english: null, bilingual: null};
         
         // Очищаем localStorage
         appInstance.clearActiveSessionsFromLocalStorage();
         
         // Сохраняем null-сессии на сервере
         appInstance.saveCurrentProfileProgress();
     }
     
     return `<h1>🏆 Поздравляем! Мастер профиля! 🏆</h1>
             <div class="card-training">
                <h2>Ты настоящий мастер этого профиля!</h2>
                <p style="font-size: 18px; margin: 20px 0;">Ты успешно прошёл все три языковых режима и доказал своё владение лексикой. Отличная работа!</p>
                <div style="margin-top: 30px;">
                    <button class="button" onclick="app.navigateTo('profileDashboard')">В меню профиля (Enter)</button>
                    <button class="button secondary small" style="margin-top: 10px;" onclick="app.resetActiveProfile()">Начать этот профиль заново</button>
                </div>
            </div>`;
}
