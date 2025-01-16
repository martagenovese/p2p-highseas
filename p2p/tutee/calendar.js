const userName = localStorage.getItem('user_name');
const matricola = localStorage.getItem('user_id');

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'tutee') {
        window.location.href = '../login.html';
    }

    if (userName) {
        document.getElementById('greeting').textContent = `Welcome, ${userName}!`;
    }

    createCalendar(matricola, 'http://peertopeer.martagenovese.com:5000/lezioni?matricolaT=');    

    const upLessons = document.getElementById('upcoming-events-list');
    upcomingLessons(upLessons);
});

function createCalendar(matricola, fetchUrl) {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: function(fetchInfo, successCallback, failureCallback) {
            fetch(fetchUrl + matricola)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const events = data.map(event => ({
                            id: event.id,
                            title: `Lezione alle ${event.ora === 1 ? '13.40' : '14.30'}`,
                            start: new Date(event.data).toISOString(),
                            allDay: false,
                            matricolaP: event.matricolaP,
                            matricolaT: event.matricolaT,
                            ora: event.ora,
                            validata: event.validata
                        }));
                        successCallback(events);
                    } else {
                        console.error('Unexpected response format:', data);
                        failureCallback(new Error('Unexpected response format'));
                    }
                })
                .catch(error => {
                    console.error('Error fetching events:', error);
                    failureCallback(error);
                });
        },
        eventClick: function(info) {
            removeEvent(matricola, info);
        }
    });

    calendar.render();
}

function removeEvent(matricola, info) {
    if (confirm(`Do you want to remove this reservation: ${info.event.title}?`)) {
        fetch('http://peertopeer.martagenovese.com:5000/lezioni', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matricolaT: matricola,
                data: info.event.start.toISOString().split('T')[0],
                ora: info.event.extendedProps.ora,
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Reservation removed successfully');
                info.event.remove();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error removing reservation:', error);
            alert('An error occurred. Please try again.');
        });
    }
}

function upcomingLessons(upLessons) {
    fetch('http://peertopeer.martagenovese.com:5000/lezioni?matricolaT=' + matricola)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                const lessons = data.map(lesson => {
                    const li = document.createElement('li');
                    li.textContent = `Lezione con ${lesson.matricolaP} il ${lesson.data} alle ${lesson.ora === 1 ? '13.40' : '14.30'} su ${lesson.materiaL}: ${lesson.argomenti}`;
                    return li;
                });
                lessons.forEach(lesson => upLessons.appendChild(lesson));
            } else {
                console.error('Unexpected response format:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching upcoming lessons:', error);
        });
}     