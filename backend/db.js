// backend/db.js
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

let config;

// ВАЖНО: Используем правильную переменную из Vercel
// POSTGRES_URL - это та, что начинается с "postgres://"
const CONNECTION_STRING = process.env.POSTGRES_URL;

console.log('Проверка переменной окружения:', CONNECTION_STRING ? 'найдена' : 'НЕ НАЙДЕНА');

if (CONNECTION_STRING) {
    try {
        // Парсим строку подключения
        const parsedConfig = parse(CONNECTION_STRING);

        config = {
            ...parsedConfig, // Используем распарсенные user, password, host, port, database
            ssl: {
                rejectUnauthorized: false // Явно добавляем настройку SSL
            }
        };
        console.log("Подключение к облачной базе данных через распарсенную строку.");

    } catch (parseError) {
        console.error("❌ Ошибка парсинга строки подключения:", parseError);
        // Fallback or handle error appropriately if parsing fails
        // For now, we'll let it fail later during Pool creation
        config = {}; // Ensure config is an object to avoid Pool errors
    }
} else {
    // Локальные настройки (для разработки)
    config = {
        user: 'postgres',
        host: 'localhost',
        database: 'language_trainer_db',
        password: 'Aa12345',
        port: 5432,
    };
    console.log("Используются локальные настройки для разработки.");
}

let pool;
try {
    pool = new Pool(config);

    // Проверка подключения
    pool.on('connect', () => {
        console.log('✅ Успешное подключение к базе данных PostgreSQL');
    });

    // Оставляем обработчик ошибок, он важен
    pool.on('error', (err) => {
        console.error('❌ Ошибка пула соединений:', err.message || err);
    });

} catch (poolError) {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА при создании Pool:", poolError);
    // Handle critical error, maybe try to export a dummy pool or throw
    // For Vercel, throwing might be best to indicate function failure
    throw new Error("Не удалось инициализировать пул подключений к БД.");
}

module.exports = pool;