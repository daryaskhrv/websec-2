let HTMLParser = require('node-html-parser');
const express = require('express');
const PORT = process.env.PORT || 3000;
let XMLHttpRequest = require('xhr2');
const path = require('path');
let http = require('http');
const app = express();
let server = http.Server(app);
let bp = require('body-parser');
const fs = require('fs');
const groups = JSON.parse(fs.readFileSync('groups.json', 'utf8'));
const lecturers = JSON.parse(fs.readFileSync('lecturer.json', 'utf8'));


app.use(express.static(path.join(__dirname, 'client')));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));


server.listen(PORT, function() {
    console.log('Server listening on 3000 . . .');
});


app.get('/rasp', (req, res) => {
    console.log(req.url);
    let request = new XMLHttpRequest();
    let url = "https://ssau.ru" + req.url;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = () => {
        if (request.readyState == 4) {
            let schedule = {
                dates: [],
                daysOfSchedule: [],
                times: [],
                groupInfo: {},
                pageHeader: ""
            };
            let root = HTMLParser.parse(request.responseText);

            // Парсим заголовок страницы
            const pageHeader = root.querySelector(".page-header h1.h1-text");
            if (pageHeader) {
                schedule.pageHeader = pageHeader.innerText.trim();
            }

            // Парсим даты
            for (let cell of root.querySelectorAll(".schedule__head")) {
                if (cell.innerText.trim()) {
                    schedule.dates.push(cell.innerText.trim());
                }
            }

            console.log(root.querySelector(".week-nav-current_week")?.innerText);

            // Парсим занятия
            for (let cell of root.querySelectorAll(".schedule__item")) {
                const lessonInfo = cell.querySelector('.schedule__lesson-info');
                
                if (lessonInfo) {
                    const subject = lessonInfo.querySelector('.schedule__discipline')?.innerText.trim();
                    const place = lessonInfo.querySelector('.schedule__place')?.innerText.trim();
                    
                    // Парсим преподавателя
                    let teacher = null;
                    const teacherElement = lessonInfo.querySelector('.schedule__teacher a');
                    if (teacherElement) {
                        teacher = {
                            name: teacherElement.innerText.trim(),
                            link: teacherElement.getAttribute('href')
                        };
                    }
                    
                    // Парсим группы
                    let groups = [];
                    const groupsElement = lessonInfo.querySelector('.schedule__groups');
                    if (groupsElement) {
                        // Проверяем, есть ли элементы с классом schedule__group (номера групп)
                        const groupLinks = groupsElement.querySelectorAll('.schedule__group');
                        
                        if (groupLinks.length > 0) {
                            groupLinks.forEach(link => {
                                groups.push(link.innerText.trim());
                            });
                        } else {
                            groups.push(groupsElement.innerText.trim());
                        }
                    }

                    schedule.daysOfSchedule.push({
                        subject: subject || null,
                        place: place || null,
                        teacher: JSON.stringify(teacher),
                        groups: groups.length > 0 ? groups.join('    ') : null
                    });
                } else {
                    schedule.daysOfSchedule.push({
                        subject: null
                    });
                }
            }

            // Парсим время занятий
            for (let cell of root.querySelectorAll(".schedule__time")) {
                const timeText = cell.innerText.trim();
                if (timeText) {
                    schedule.times.push(timeText);
                }
            }

            // Парсим информацию о группе
            const infoBlock = root.querySelector(".card-default.info-block");
            if (infoBlock) {

                const groupNumber = infoBlock.querySelector("h2.info-block__title")?.innerText.trim();

                const specialtyElement = infoBlock.querySelector(".info-block__description > div:first-child");
                const specialty = specialtyElement?.innerText.trim();
                
                const educationFormElement = infoBlock.querySelector(".info-block__description > div:nth-child(2)");
                const educationForm = educationFormElement?.innerText.trim();
                
                const yearStartElement = infoBlock.querySelector(".info-block__semester div");
                const yearStart = yearStartElement?.innerText.trim();
                
                schedule.groupInfo = {
                    groupNumber: groupNumber || null,
                    specialty: specialty || null,
                    educationForm: educationForm || null,
                    yearStart: yearStart || null
                };
            }

            schedule.currentWeek = root.querySelector(".week-nav-current_week")?.innerText.slice(1, 3).trim();
            res.json(schedule);
        }
    };
});


// поиск ID 
app.get('/search', (req, res) => {
    const query = req.query.q.trim();
    
    // Проверяем сначала группы
    if (groups[query]) {
        console.log(groups[query],query)
        return res.json({
            type: 'group',
            id: groups[query],
            name: query
        });
    }
    
    // Затем проверяем преподавателей
    for (const [name, id] of Object.entries(lecturers)) {
        if (name.toLowerCase().includes(query.toLowerCase())) {
            console.log(id,name)
            return res.json({
                type: 'staff',
                id: id,
                name: name
            });
        }
    }
    
    // Если ничего не найдено
    res.status(404).json({ error: 'Not found' });
});
