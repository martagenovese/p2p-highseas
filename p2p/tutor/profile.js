document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logged_in') !== 'true' || localStorage.getItem('user_type') !== 'tutor') {
        window.location.href = '../login.html';
    }

    const subjectsList = document.getElementById('subjects-list');
    const matricola = localStorage.getItem('user_id');

    // Fetch and display the list of subjects
    fetch(`http://peertopeer.martagenovese.com:5000/materie?matricola=${matricola}`)
        .then(response => response.json())
        .then(data => {
            data.forEach(subject => {
                const listItem = document.createElement('li');
                listItem.textContent = subject;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Remove';
                deleteButton.addEventListener('click', () => handleRemoveSubject(subject, listItem));
                listItem.appendChild(deleteButton);
                subjectsList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Errore durante il recupero delle materie', error));

    // Handle the addition of a new subject
    document.getElementById('add-subject').addEventListener('submit', handleAddSubject);
});

function handleRemoveSubject(subjectId, listItem) {
    const tutorId = localStorage.getItem('user_id');
    if (confirm('Sei sicuro di voler rimuovere questa materia?')) {
        fetch('http://peertopeer.martagenovese.com:5000/materie', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricola: tutorId, idMat: subjectId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Materia rimossa con successo');
                listItem.remove();
            } else {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Errore durante la rimozione della materia', error);
            alert('Si è verificato un errore. Riprova.');
        });
    }
}

function handleAddSubject() {
    const form = document.getElementById('add-subject');
    const subjectName = form.querySelector('input[name="subject_name"]').value.toUpperCase();
    const tutorId = localStorage.getItem('user_id');

    fetch('http://peertopeer.martagenovese.com:5000/materie', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matricola: tutorId, materia: subjectName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Materia aggiunta con successo');
            // Add the new subject to the list
            const listItem = document.createElement('li');
            listItem.textContent = subjectName;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Rimuovi';
            deleteButton.addEventListener('click', () => handleRemoveSubject(data.subject_id, listItem));
            listItem.appendChild(deleteButton);
            document.getElementById('subjects-list').appendChild(listItem);
        } else {
            alert(`Errore: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Errore durante l\'aggiunta della materia:', error);
        alert('Si è verificato un errore. Riprova.');
    });
}