// backend/authMiddleware.js
// (ПОЛНЫЙ ОБНОВЛЁННЫЙ КОД)
// --- ИЗМЕНЕНИЯ:
// 1. Добавлен импорт 'pool' из './db.js'.
// 2. Добавлен 'isAdminMiddleware' (перенесен из index.js).
// 3. 'module.exports' теперь экспортирует объект с двумя функциями.

// Подключаем инструмент для работы с "пропусками"
const jwt = require('jsonwebtoken');
// Подключаем наш пул соединений
const pool = require('./db'); // Правильно, если db.js на уровень выше

// Секретный ключ должен быть ТОЧНО ТАКИМ ЖЕ, как в index.js
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-random';

// 1. Охранник для аутентификации (проверка токена)
const authMiddleware = (req, res, next) => {
  // 1. Получаем токен из заголовков запроса.
  const authHeader = req.header('Authorization');

  // 2. Если заголовка нет, токен не предоставлен.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Нет токена, доступ запрещён' });
  }

  const token = authHeader.split(' ')[1];

  // 3. Проверяем, есть ли токен после слова "Bearer"
  if (!token) {
      return res.status(401).json({ message: 'Неверный формат токена, доступ запрещён' });
  }

  try {
    // 4. Пытаемся проверить (расшифровать) токен
    const decoded = jwt.verify(token, JWT_SECRET);

    // 5. Добавляем расшифрованную информацию в объект запроса
    req.user = decoded;

    // 6. Передаём управление дальше
    next();
  } catch (err) {
    // 7. Если токен недействителен (поддельный или просрочен), отправляем ошибку
    res.status(401).json({ message: 'Токен недействителен' });
  }
};

// 2. Охранник для проверки прав администратора
// (Этот код перенесен из index.js)
const isAdminMiddleware = async (req, res, next) => {
    try {
        // ID пользователя уже должен быть в req.user из authMiddleware
        // Добавим проверку, что req.user и req.user.userId существуют
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }

        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
        const user = userResult.rows[0];
        if (user && user.email === 'admin@example.com') { // Твой email администратора
            next();
        } else {
            res.status(403).json({ message: 'Доступ запрещён. Требуются права администратора.' });
        }
    } catch (err) {
        console.error("Ошибка в isAdminMiddleware:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
};

// Экспортируем обе функции как объект
module.exports = {
    authMiddleware,
    isAdminMiddleware
};