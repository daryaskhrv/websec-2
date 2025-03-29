// Функция для форматирования даты
function formatCurrentDate() {
    const now = new Date();
    
    // Настройки для локали (русский язык)
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    return now.toLocaleDateString('ru-RU', options);
}

function updateDateTime() {
    document.querySelector('.data').textContent = formatCurrentDate();
    setTimeout(updateDateTime, 1000 * 60 * 60 * 24); // Обновлять раз в сутки
}

updateDateTime(); // Первоначальный вызов