// frontend/public/renderers/settings/renderGeneralSettings.js
// --- ИЗМЕНЕНИЕ (v21.2): Переименование futuristicView -> matrixMode ---

export function renderGeneralSettings(s, appInstance) {
    let minWordsOptions = '';
    for (let i = 1; i <= 10; i++) {minWordsOptions += `<option value="${i}" ${s.minWords === i ? 'selected' : ''}>${i}</option>`;}

    return `
        <div class="setting-row">
            <label for="min-words-select">Минимум слов для старта (Этап 1):</label>
            <select id="min-words-select" onchange="app.setUserSetting('minWords', this.value)">${minWordsOptions}</select>
        </div>
        <div class="setting-row">
            <label for="repetitions-select">Повторений для изучения (Этап 1):</label>
            <select id="repetitions-select" onchange="app.setUserSetting('repetitions', this.value)">
                ${[3,4,5,6,7].map(n => `<option value="${n}" ${s.repetitions === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
        </div>
        <div class="setting-row">
            <label for="auto-advance-delay">Секунд для автоперехода (Этап 1):</label>
            <select id="auto-advance-delay" onchange="app.setUserSetting('autoAdvanceDelay', this.value)">
                 ${[1,2,3,4,5].map(n => `<option value="${n}" ${s.autoAdvanceDelay === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
        </div>
        <div class="setting-row">
            <label for="sounds-toggle">Звуковые эффекты:</label>
            <input type="checkbox" id="sounds-toggle" ${s.soundsEnabled ? 'checked' : ''} onchange="app.setUserSetting('soundsEnabled', this.checked)">
        </div>
        <div class="setting-row">
            
            <label for="matrix-mode-toggle">Режим Матрицы:</label>
            <input type="checkbox" id="matrix-mode-toggle" ${s.futuristicView ? 'checked' : ''} onchange="app.setUserSetting('futuristicView', this.checked)">
        </div>
    `;
}
