// frontend/public/modules/footer_renderer.js
// Этот модуль отвечает за рендеринг и управление
// видимостью футера (подвала) приложения.

// Импортируем сам рендерер футера
import { renderFooter } from '../renderer.js';

/**
 * Рендерит футер и управляет его видимостью.
 * @param {App} appInstance - Экземпляр App.
 * @param {string} currentActualScreen - Название экрана, который был отрисован.
 */
export function renderAppFooter(appInstance, currentActualScreen) {
    const footer = document.getElementById('app-footer');
    if (!footer) {
        console.warn("Footer element #app-footer not found.");
        return;
    }

    // 1. Рендерим содержимое футера
    footer.innerHTML = renderFooter(appInstance, appInstance.state);

    // 2. Управляем видимостью
    const screensToHideFooter = [
        'training', 
        'stage2', 
        'stage3', 
        'wordSelection'
    ];
    
    if (screensToHideFooter.includes(currentActualScreen)) {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'block';
    }
}
