export function normalizeString(str) { 
    if (typeof str !== 'string') return ''; 
    return str.trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Убираем диакритические знаки
              .replace(/[.,!?;:"'()`’‘“”—]/g, ''); // Убираем пунктуацию и кавычки
}

// Сюда можно будет добавлять другие общие функции в будущем