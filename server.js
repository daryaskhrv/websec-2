const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Указываем Express обслуживать статические файлы из папки client
app.use(express.static(path.join(__dirname, 'client')));

// Все остальные запросы перенаправляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT} в браузере`);
});