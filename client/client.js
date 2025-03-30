let currentUrl = '/rasp?groupId=1213641978';
let currentWeek;
let currentWeekday = 1;
let currentType = 'groupId'; 
let currentId = '1213641978'; 


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('previousButton').addEventListener('click', function() {updateWeek(-1);});
    document.getElementById('nextButton').addEventListener('click', function() {updateWeek(1);});
    updateSchedule(currentUrl);
});


// обновляем неделю
function updateWeek(change) {
    const newWeek = currentWeek + change;
    if (newWeek < 1) return; 
    currentWeek = newWeek;
    document.getElementById('previousButton').style.visibility = currentWeek === 1 ? 'hidden' : 'visible';
    const newUrl = currentUrl + `&selectedWeek=${currentWeek}&selectedWeekday=${currentWeekday}`;
    updateSchedule(newUrl);
}




// Обработчик поиска
document.getElementById('search_schedule').addEventListener('input', debounce(function(e) {
    const query = e.target.value.trim();
    if (query.length < 3) return; // Не ищем слишком короткие запросы
    
    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) return Promise.reject('Not found');
            return response.json();
        })
        .then(data => {
            // Обновляем текущие параметры
            currentType = data.type;
            currentId = data.id;
            
            // Формируем новый URL
            const newUrl = `/rasp?${currentType}Id=${currentId}&selectedWeek=${currentWeek}&selectedWeekday=${currentWeekday}`;
            
            updateSchedule(newUrl);
        })
}, 500)); 


// чтобы не отправлять запрос на каждый ввод символа
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}



function updateSchedule(url) {
    currentUrl = url;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Обновляем текущую неделю
            currentWeek = parseInt(data.currentWeek);
            
            // Обновляем заголовок страницы
            const headerElement = document.getElementById('h1_main');
            if (headerElement && data.pageHeader) {
                headerElement.textContent = data.pageHeader;
            }

            // Обновляем отображение недели
            const weekElement = document.getElementById('currentWeek');
            if (weekElement) {
                weekElement.textContent = `${currentWeek} неделя`;
            }
            
            // Управление видимостью кнопок
            const previousButton = document.querySelector("#previousButton");
            if (previousButton) {
                previousButton.style.visibility = currentWeek == 1 ? "hidden" : "visible";
            }

            // Обновляем информацию о группе
            if (data.groupInfo) {
                const textP1 = document.getElementById('text_p1');
                const textP2 = document.getElementById('text_p2');
                const textP3 = document.getElementById('text_p3');
                
                if (textP1 && data.groupInfo.groupNumber) {
                    textP1.textContent = data.groupInfo.groupNumber;
                }
                
                if (textP2) {
                    textP2.innerHTML = '';
                    if (data.groupInfo.specialty) {
                        textP2.appendChild(document.createTextNode(data.groupInfo.specialty));
                    }
                    if (data.groupInfo.educationForm) {
                        textP2.appendChild(document.createElement('br'));
                        textP2.appendChild(document.createTextNode(data.groupInfo.educationForm));
                    }
                }
                
                if (textP3 && data.groupInfo.yearStart) {
                    textP3.textContent = data.groupInfo.yearStart;
                }
            }

            // Рендерим расписание
            renderSchedule(data);
            console.log(data);
        })
        .catch(error => {
            console.error('Ошибка при загрузке расписания:', error);
        });
}


function renderSchedule(data) {
    const table = document.querySelector("#schedule_table");
    table.innerHTML = "";
    
    // Создаем строку заголовков
    const headers = table.insertRow();
    headers.classList.add("first-row");
    headers.insertCell().appendChild(document.createTextNode("Время"));

    // Добавляем заголовки 
    data.dates.slice(1).forEach((date, index) => {
        const cell = headers.insertCell();
        cell.appendChild(document.createTextNode(date));
        cell.classList.add(`column-${index}`);
    });

    // Обрабатываем каждое время занятий
    data.times.forEach((time, timeIndex) => {
        const row = table.insertRow();
        row.classList.add("one-row");
        row.insertCell().appendChild(document.createTextNode(time));

        for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
            const scheduleIndex = 7 + timeIndex * 6 + dayIndex;
            const day = data.daysOfSchedule[scheduleIndex];
            const cell = row.insertCell();
            cell.classList.add("one-cell", `column-${dayIndex}`);

            if (day?.subject) {
                const infoDiv = document.createElement("div");
                infoDiv.classList.add("text-style1");
                
                infoDiv.innerHTML = `${day.subject}<br>${day.place}<br>`;
                
                if (day.teacher && day.teacher !== "null") {
                    const teacher = JSON.parse(day.teacher);
                    const teacherElement = teacher.link 
                        ? createLinkElement(teacher.name, teacher.link)
                        : createTextElement(teacher.name);
                    infoDiv.appendChild(teacherElement);
                    infoDiv.appendChild(document.createElement("br"));
                }
                
                // Добавляем группы
                if (day.groups) {
                    const groupsElement = createTextElement(day.groups);
                    infoDiv.appendChild(groupsElement);
                }
                
                cell.appendChild(infoDiv);
            }
        }
    });
}


function createLinkElement(text, href) {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = text;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        updateSchedule(href);
    });
    return link;
}


function createTextElement(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div;
}