// frontend/public/renderers/renderCompletion.js
// (Этот файл содержит функцию рендеринга для экрана "Этап пройден")

export function renderCompletion(appInstance, state) {
     // Рендерит экран "Этап пройден" (после Этапа 3, если не все языки завершены)
     setTimeout(() => {appInstance.playSound({frequency: 1300, duration: 0.5, type: 'triangle'});}, 100);
     const profile = appInstance.getActiveProfile();
     // Очищаем сессию ТОЛЬКО для текущего языка при показе этого экрана
     if (profile && profile.sessions && profile.language) {
         profile.sessions[profile.language] = null;
         // Сохраняем обновленное состояние сессий в localStorage
         appInstance.saveActiveSessionsToLocalStorage();
         // Немедленно сохраняем на сервере, что сессия для этого языка завершена
         appInstance.saveCurrentProfileProgress();
     }
     return `<h1>🎉 Этап пройден! 🎉</h1>
             <div class="card-training">
                 <h2>Отличная работа!</h2>
                 <p style="font-size: 18px; margin: 20px 0;">Все слова отработаны в контексте для этого языка. Ты готов к новым вызовам!</p>
                 <div style="margin-top: 30px;">
                     <button class="button" onclick="app.navigateTo('profileDashboard')">В меню профиля (Enter)</button>
                 </div>
             </div>`;
}
