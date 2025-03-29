let currentUrl = '/rasp?groupId=1213641978';
fetch(currentUrl)
    .then((data) => data.json())
    .then((res) => {
        console.log(res);
    })