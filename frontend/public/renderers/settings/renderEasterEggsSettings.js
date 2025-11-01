// frontend/public/renderers/settings/renderEasterEggsSettings.js (v20.28)

export function renderEasterEggsSettings(s, appInstance) {
     if (!appInstance.isAdmin()) return '';
     // Текущее значение размера из state или default
     const currentSize = s.easterEggFontSize || appInstance.defaultSettings.easterEggFontSize;
     const currentSizeValue = parseInt(currentSize, 10); // Убираем 'px' для ползунка

     return `
        <h3>Пасхалка "Ангел/Бес" (Этап 1, кнопка "Далее")</h3>
        <p style="font-size: 0.9em; opacity: 0.7; margin-bottom: 15px;">Появляется при повторных кликах на "Далее", когда не все буквы введены.</p>
        <div class="setting-row">
            <label for="ee-trigger1" title="Сколько раз нужно кликнуть 'Далее' при ошибке, чтобы появился первый эмодзи">Кликов для 1-го эмодзи:</label>
            <input type="number" id="ee-trigger1" min="1" value="${s.easterEggTrigger1}" onchange="app.setUserSetting('easterEggTrigger1', this.value)">
        </div>
        <div class="setting-row">
            <label for="ee-trigger2" title="Сколько еще раз нужно кликнуть 'Далее' при ошибке (после первого), чтобы появился второй эмодзи">Кликов для 2-го эмодзи (относительно 1-го):</label>
            <input type="number" id="ee-trigger2" min="1" value="${s.easterEggTrigger2}" onchange="app.setUserSetting('easterEggTrigger2', this.value)">
        </div>
         <div class="setting-row">
            <label for="ee-cycle" title="Через сколько циклов показа эмодзи будут появляться их 'множественные' версии">Длина цикла (для *):</label>
            <input type="number" id="ee-cycle" min="1" value="${s.easterEggCycleLength}" onchange="app.setUserSetting('easterEggCycleLength', this.value)">
        </div>
        <div class="setting-row">
            <label for="ee-emoji1" title="Эмодзи, который появляется при первом достижении триггера (кроме последнего цикла)">Эмодзи 1 (один):</label>
            <input type="text" id="ee-emoji1" value="${s.easterEggEmoji1}" onchange="app.setUserSetting('easterEggEmoji1', this.value)">
        </div>
        <div class="setting-row">
            <label for="ee-emoji2" title="Эмодзи, который появляется при втором достижении триггера (кроме последнего цикла)">Эмодзи 2 (один):</label>
            <input type="text" id="ee-emoji2" value="${s.easterEggEmoji2}" onchange="app.setUserSetting('easterEggEmoji2', this.value)">
        </div>
         <div class="setting-row">
            <label for="ee-multi1" title="Эмодзи, который появляется при первом достижении триггера в последнем цикле">Эмодзи 1 (*):</label>
            <input type="text" id="ee-multi1" value="${s.easterEggMultiEmoji1}" onchange="app.setUserSetting('easterEggMultiEmoji1', this.value)">
        </div>
         <div class="setting-row">
            <label for="ee-multi2" title="Эмодзи, который появляется при втором достижении триггера в последнем цикле">Эмодзи 2 (*):</label>
            <input type="text" id="ee-multi2" value="${s.easterEggMultiEmoji2}" onchange="app.setUserSetting('easterEggMultiEmoji2', this.value)">
        </div>
        
        <div class="setting-row">
            <label for="ee-font-size-slider" id="ee-font-size-label">Размер пасхалки: (${currentSize})</label>
            <input type="range" id="ee-font-size-slider" min="40" max="250" step="1"
                   value="${currentSizeValue}"
                   oninput="
                       const newSize = this.value + 'px';
                       document.getElementById('ee-font-size-label').textContent = 'Размер пасхалки: (' + newSize + ')';
                       app.setUserSetting('easterEggFontSize', newSize);
                       app.showEasterEgg(app.getSetting('easterEggEmoji1')); // Показываем пример для предпросмотра
                   ">
        </div>


        <hr style="width: 100%; margin: 20px 0;">
        <h3>Награда "Мастер профиля" (кнопка Enter)</h3>
        <p style="font-size: 0.9em; opacity: 0.7; margin-bottom: 15px;">Появляется при нажатии Enter на дашборде, если профиль полностью пройден.</p>
         <div class="setting-row">
            <label for="master-emoji1">Эмодзи 1:</label>
            <input type="text" id="master-emoji1" value="${s.masterEmoji1}" onchange="app.setUserSetting('masterEmoji1', this.value)">
        </div>
         <div class="setting-row">
            <label for="master-emoji2">Эмодзи 2:</label>
            <input type="text" id="master-emoji2" value="${s.masterEmoji2}" onchange="app.setUserSetting('masterEmoji2', this.value)">
        </div>
         <div class="setting-row">
            <label for="master-emoji3">Эмодзи 3:</label>
            <input type="text" id="master-emoji3" value="${s.masterEmoji3}" onchange="app.setUserSetting('masterEmoji3', this.value)">
        </div>
    `;
}
