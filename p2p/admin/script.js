document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'admin') {
        window.location.href = '../login.html';
    }

    var calendarEl = document.getElementById('calendar');
    var unvalidatedEventsList = document.getElementById('unvalidated-events-list');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: function(fetchInfo, successCallback, failureCallback) {
            fetch('http://peertopeer.martagenovese.com:5000/lezioni')
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const events = data.map(event => ({
                            id: event.id,
                            title: `${event.validata===0 ? 'Richiesta ' : ''}Lezione alle ${event.ora === 1 ? '13.40' : '14.30'}`,
                            start: new Date(event.data).toISOString(),
                            allDay: false,
                            matricolaP: event.matricolaP,
                            ora: event.ora,
                            validata: event.validata
                        }));
                        successCallback(events);

                        // Clear the existing list
                        unvalidatedEventsList.innerHTML = '';

                        // Populate the list with unvalidated events
                        events.filter(event => event.validata === 0).forEach(event => {
                            const listItem = document.createElement('li');
                            const add = document.createElement('button');
                            add.textContent = 'Valida';
                            listItem.textContent = `${event.title} da parte di ${event.matricolaP} il giorno ${event.start.split('T')[0]}`;
                            listItem.dataset.eventId = event.id;
                            add.addEventListener('click', () => {
                                if (confirm(`Vuoi validare questa lezione: ${event.title}?`)) {
                                    fetch('http://peertopeer.martagenovese.com:5000/lezioni', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            matricolaP: event.matricolaP,
                                            data: event.start.toString().split('T')[0],
                                            ora: event.ora,
                                        })
                                    })
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.message) {
                                            alert('Lezione validata con successo');
                                            // Remove the event from the list
                                            unvalidatedEventsList.removeChild(listItem);
                                            calendar.render();
                                            // Update the event in the calendar
                                            const calendarEvent = calendar.getEventById(event.id);
                                            if (calendarEvent) {
                                                calendarEvent.setProp('title', `Richiesta: ${calendarEvent.title}`);
                                            }
                                            // reload the page
                                            location.reload();
                                        } else {
                                            alert(`Error: ${data.error}`);
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Errore durante la validazione della lezione', error);
                                        alert('Si è verificato un errore. Riprova.');
                                    });
                                }

                            });
                            listItem.appendChild(add);
                            unvalidatedEventsList.appendChild(listItem);
                        });
                    } else {
                        console.error('Formato inaspettato', data);
                        failureCallback(new Error('Formato inaspettato'));
                    }
                })
                .catch(error => {
                    console.error('Errore nel recuperare gli eventi', error);
                    failureCallback(error);
                });
        }
    });

    calendar.render();
});