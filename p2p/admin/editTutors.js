// Handle the addition of a new tutor
document.getElementById('add-tutor').addEventListener('submit', handleAddTutor, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'admin') {
        window.location.href = '../login.html';
    }

    const tutorsTableBody = document.querySelector('#tutors-table tbody');

    // Fetch and display the list of tutors
    fetch('http://peertopeer.martagenovese.com:5000/tutors')
        .then(response => response.json())
        .then(data => {
            data.forEach(tutor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tutor.matricola}</td>
                    <td>${tutor.nome}</td>
                    <td>${tutor.cognome}</td>
                    <td>${tutor.classe}</td>
                    <td><button class="delete-button">Elimina</button></td>
                `;
                row.querySelector('.delete-button').addEventListener('click', () => handleDeleteTutor(tutor.matricola, row));
                tutorsTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching tutors:', error));
});

function handleDeleteTutor(matricola, row) {
    if (confirm('Sei sicuro di voler eliminare questo tutor?')) {
        fetch('http://peertopeer.martagenovese.com:5000/tutors', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricola: matricola })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Tutor eliminato con successo');
                row.remove();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Errore durante la rimozione del tutor :', error);
            alert('Si è verificato un errore. Riprova.');
        });
    }
}

function handleAddTutor(event) {
    const form = document.getElementById('add-tutor');
    const matricola = form.querySelector('input[name="matricola"]').value;
    const name = form.querySelector('input[name="nome"]').value;
    const cognome = form.querySelector('input[name="cognome"]').value;
    const classe = form.querySelector('input[name="classe"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const tutorMail = form.querySelector('input[name="tutor-mail"]').value;
    const genitoreMail = form.querySelector('input[name="genitore-mail"]').value;

    fetch('http://peertopeer.martagenovese.com:5000/tutors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matricola: matricola,
            nome: name,
            cognome: cognome,
            classe: classe,
            password: password,
            tutorMail: tutorMail,
            genitoreMail: genitoreMail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Tutor aggiunto con successo');
            // Add the new tutor to the list
            const row = document.createElement('tr');
            listItem = document.createElement('td');
            listItem.textContent = matricola;
            row.appendChild(listItem);
            listItem = document.createElement('td');
            listItem.textContent = name;
            row.appendChild(listItem);
            listItem = document.createElement('td');
            listItem.textContent = cognome;
            row.appendChild(listItem);
            listItem = document.createElement('td');
            listItem.textContent = classe;
            row.appendChild(listItem);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Elimina';
            deleteButton.addEventListener('click', () => handleDeleteTutor(data.matricola, row));
            row.appendChild(deleteButton);
            document.getElementById('tutors-table').appendChild(row);
        } else {
            alert(`Errore: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Errore durante l\'aggiunta del tutor :', error);
        alert('Si è verificato un errore. Riprova.');
    });
}