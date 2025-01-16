const userName = localStorage.getItem('user_name');
const matricola = localStorage.getItem('user_id');

const materieSelect = document.getElementById('materie');
const classesSelect = document.getElementById('tutor_classes');
const indirizzoSelect = document.getElementById('tutor_indirizzo');


document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'tutee') {
        window.location.href = '../login.html';
    }

    if (userName) {
        document.getElementById('greeting').textContent = `Welcome, ${userName}!`;
    }

    createMaterieDropdown();
    createAnnoTutorDropdown();
    createIndirizzoDropdown();

    createCalendar(matricola, 'http://peertopeer.martagenovese.com:5000/lezioni?validata=1&matricolaT=NULL');
    
});

function createMaterieDropdown() {
    fetch('http://peertopeer.martagenovese.com:5000/materie')
        .then(response => response.json())
        .then(data => {
            option = document.createElement('option');
            option.value = 'ALL';
            option.textContent = 'ALL';
            materieSelect.appendChild(option);
            data.forEach(materia => {
                option = document.createElement('option');
                option.value = materia.id;
                option.textContent = materia.id;
                materieSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Errore durante il recupero delle materie:', error));

    materieSelect.addEventListener('change', function() {
        const selectedMateria = materieSelect.value;
        const selectedAnno = classesSelect.value;
        const selectedIndirizzo = indirizzoSelect.value;
        createCalendar(matricola, 'http://peertopeer.martagenovese.com:5000/lezioniFilter?idMat=' + selectedMateria + '&anno=' + selectedAnno + '&indirizzo=' + selectedIndirizzo);
    });

}

function createAnnoTutorDropdown() {
    fetch('http://peertopeer.martagenovese.com:5000/tutors')
        .then(response => response.json())
        .then(data => {
            option = document.createElement('option');
            option.value = 'ALL';
            option.textContent = 'ALL';
            classesSelect.appendChild(option);
            annopre = 0;
            data.forEach(classe => {
                anno = classe.classe.split()[0][0];
                if (anno != annopre) {
                    option = document.createElement('option');
                    option.value = anno;
                    option.textContent = anno;
                    classesSelect.appendChild(option);
                    annopre = anno;
                }
            });
        })
        .catch(error => console.error('Errore durante il recupero delle classi', error));

    classesSelect.addEventListener('change', function() {
        const selectedAnno = classesSelect.value;
        const selectedIndirizzo = indirizzoSelect.value;
        const selectedMateria = materieSelect.value;
        createCalendar(matricola, 'http://peertopeer.martagenovese.com:5000/lezioniFilter?anno=' + selectedAnno + '&indirizzo=' + selectedIndirizzo + '&idMat=' + selectedMateria);
    });
}

function createIndirizzoDropdown() {
    option = document.createElement('option');
    option.value = 'ALL';
    option.textContent = 'ALL';
    indirizzoSelect.appendChild(option);
    ['Informatica', 'Elettronica', 'Telecomunicazioni', 'Costruzione del Mezzo', 'Logistica', 'Biennio'].forEach(indirizzo => {
        option = document.createElement('option');
        option.value = indirizzo;
        option.textContent = indirizzo;
        indirizzoSelect.appendChild(option);
    });

    indirizzoSelect.addEventListener('change', function() {
        const selectedIndirizzo = indirizzoSelect.value;
        const selectedAnno = classesSelect.value;
        const selectedMateria = materieSelect.value;
        createCalendar(matricola, 'http://peertopeer.martagenovese.com:5000/lezioniFilter?indirizzo=' + selectedIndirizzo + '&anno=' + selectedAnno + '&idMat=' + selectedMateria);
    });
}

function createCalendar(matricola, fetchUrl) {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: function(fetchInfo, successCallback, failureCallback) {
            fetch(fetchUrl)
                .then(response => response.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const events = data.map(event => ({
                            title: `${event.validata === 0 ? 'Richiesta' : ''} Lezione alle ${event.ora === 1 ? '13.40' : '14.30'}`,
                            start: new Date(event.data).toISOString(), // Ensure correct date format
                            allDay: false,
                            matricolaP: event.matricolaP,
                            ora: event.ora,
                            materiaL: event.idMat
                        }));
                        successCallback(events);
                    } else {
                        console.error('Formato inaspettato:', data);
                        failureCallback(new Error('Formato inaspettato'));
                    }
                })
                .catch(error => {
                    console.error('Errore durante il recupero degli eventi', error);
                    failureCallback(error);
                });
        },
        selectable: true,
        selectAllow: function(selectInfo) {
            let now = new Date();
            now.setDate(now.getDate() + 2); // Two days ahead of the current date
            return selectInfo.start >= now;
        },
        eventClick: async function(info) {
            let now = new Date();
            now.setDate(now.getDate());
            if (info.event.start <= now) {
                alert('Non puoi prenotare una lezione per una data passata od odierna.');
                return;
            }
            tuteeAvailable = await tuteeHasLesson(info);
            if (tuteeAvailable) {
                alert('Hai già prenotato una lezione per questa data e ora.');
                return;
            }

            materiaL = prompt('Inserisci la materia della lezione:');
            if (!materiaL || materiaL === '' || materiaL.length !== 3) {
                alert('Inserisci una materia valida.');
                return;
            }
            materiaL = materiaL.toUpperCase();

            available = await checkIfTutor(info.event.extendedProps.matricolaP, materiaL);
            if (!available) {
                alert('Il tutor selezionato non è disponibile per la materia scelta.');
                return;
            }

            const argomenti = prompt('Inserisci gli argomenti della lezione:');
            if (confirm(`Vuoi prenotare questa lezione ${info.event.title}?`)) {
                fetch('http://peertopeer.martagenovese.com:5000/prenota', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        matricolaP: info.event.extendedProps.matricolaP,
                        data: info.event.start.toISOString().split('T')[0], // Format date correctly
                        ora: info.event.extendedProps.ora,
                        matricolaT: matricola,
                        materiaL: materiaL,
                        argomenti: argomenti,
                        nomecognT: userName
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert('Lezione prenotata con successo');
                        location.reload();
                    } else {
                        alert(`Errore: ${data.error}`);
                    }
                })
                .catch(error => {
                    console.error('Errore durante la prenotazione della lezione', error);
                    alert('Si è verificato un errore. Riprova.');
                });
            } else {
                alert('Prenotazione annullata con successo');
            }
        }
    });

    calendar.render();
}

async function checkIfTutor(matricolaP, materiaL) {
    try {
        const response = await fetch('http://peertopeer.martagenovese.com:5000/materie?matricola=' + matricolaP, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error('La risposta del server non è valida');
        }
        const data = await response.json();
        available = false
        data.forEach(materia => {
            if (materia[0] == materiaL) {
                available = true;
            }
        });
        return available;
    } catch (error) {
        console.error('Errore durante l\'accertamento della disponibilità del tutor', error);
        return false;
    }
}

async function tuteeHasLesson(info) {
    dataL = info.event.start.toISOString().split('T')[0];
    ora = info.event.extendedProps.ora;
    matricolaT = matricola;
    const response = await fetch('http://peertopeer.martagenovese.com:5000/lezioni?matricolaT='+matricolaT + '&ora=' +ora+ 'data='+dataL , {
        method: 'GET',
    });
    if (!response.ok) {
        throw new Error('La risposta del server non è valida');
    }
    const data = await response.json();    
    return data.length > 0;
}