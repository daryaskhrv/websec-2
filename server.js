let HTMLParser = require('node-html-parser');
const express = require('express');
const PORT = process.env.PORT || 3000;
let XMLHttpRequest = require('xhr2');
const path = require('path');
let http = require('http');
const app = express();
let server = http.Server(app);
let bp = require('body-parser');


// Указываем Express обслуживать статические файлы из папки client
app.use(express.static(path.join(__dirname, 'client')));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));


app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(PORT, function() {
    console.log('Server listening on 3000 . . .');
});


// https://ssau.ru/rasp?groupId=531030143&selectedWeek=22&selectedWeekday=1
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
                times: []
            };
            let root = HTMLParser.parse(request.responseText);

            // parse days with dates
            for (let cell of root.querySelectorAll(".schedule__item + .schedule__head")) {
                schedule.dates.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText)
            }

            console.log(root.querySelector(".week-nav-current_week")?.innerText);

            // parse all cells
            for (let cell of root.querySelectorAll(".schedule__item")) {
                if (cell.childNodes[0]?.childNodes.length > 3) {
                    // console.log(cell.childNodes[0].childNodes[3].childNodes[1]);
                    let groups = [];
                    if (typeof req.query.staffId === "undefined") {
                        cell.childNodes[0].childNodes[3].childNodes
                            .filter((group) => group.innerText.trim() !== "")
                            .map((group) => {
                                let ind1 = 0;
                                while (!isNumber(group.toString()[ind1]) && ind1 < 100) ind1++;
                                let ind2 = ind1;
                                while (isNumber(group.toString()[ind2]) && ind2 < 100) ind2++;
                                while (group.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                                let id = group.toString().slice(ind1, ind2);
                                groups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: isNumber(id[id.length - 4]) ? `/rasp${id}` : null
                                }))
                            })
                    } else {
                        let groupsElements = cell.querySelectorAll("a")
                            .filter((group) => group.innerText.trim() !== "")
                            .map((group) => {
                                let ind1 = 0;
                                while (!isNumber(group.toString()[ind1]) && ind1 < 100) ind1++;
                                let ind2 = ind1;
                                while (isNumber(group.toString()[ind2]) && ind2 < 100) ind2++;
                                while (group.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                                let id = group.toString().slice(ind1, ind2);
                                groups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: isNumber(id[id.length - 4]) ? `/rasp${id}` : null
                                }))
                            })
                        console.log(groups);
                    }

                    let id = "";
                    if (typeof req.query.staffId === "undefined") {
                        let teacher = cell.childNodes[0].childNodes[2].childNodes;
                        let ind1 = 5;
                        while (!isNumber(teacher.toString()[ind1]) && ind1 < 100) ind1++;
                        let ind2 = ind1;
                        while (isNumber(teacher.toString()[ind2]) && ind2 < 100) ind2++;
                        while (teacher.toString()[ind1] !== "?" && ind1 > 0) ind1--;
                        id = teacher.toString().slice(ind1, ind2);
                    }

                    schedule.daysOfSchedule.push({
                        subject: cell.childNodes[0].childNodes[0].innerText.slice(1),
                        place: cell.childNodes[0].childNodes[1].innerText.slice(1),
                        teacher: JSON.stringify(typeof req.query.staffId === "undefined" ? {
                            name: cell.querySelector(".schedule__teacher")?.innerText ?? cell.childNodes[0].childNodes[2].childNodes[0].innerText,
                            link: isNumber(id[id.length - 1]) ? `/rasp${id}` : null } : { name: "", link: "" }),
                        groups: groups
                    })
                } else {
                    schedule.daysOfSchedule.push({
                        subject: null
                    })
                }
            }

            // parse times of first column
            for (let cell of root.querySelectorAll(".schedule__time")) {
                schedule.times.push(cell.childNodes[0].innerText + " - " + cell.childNodes[1].innerText);
            }

            // remove from field with subjects all headers with dates
            schedule.daysOfSchedule = schedule.daysOfSchedule.slice(7);
            schedule.currentWeek = root.querySelector(".week-nav-current_week")?.innerText.slice(1, 3).trim();
            res.send(JSON.stringify(schedule));
        }
    };
})

app.get('/groups', function(request, response) {
	response.sendFile(__dirname + '/groups.json');
});

app.get('/teachers', function(request, response) {
	response.sendFile(__dirname + '/lecturer.json');
});

function isNumber(char) {
    if (typeof char !== 'string') {
        return false;
    }

    if (char.trim() === '') {
        return false;
    }

    return !isNaN(char);
}