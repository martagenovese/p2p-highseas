async function handleRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    dominio = data.mail.split('@')[1];
    if (dominio != 'studenti.marconiverona.edu.it') {
        alert('Registrati con la tua email istituzionale');
        return;
    }

    try {
        const response = await fetch('http://peertopeer.martagenovese.com:5000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        const response2 = await fetch('http://peertopeer.martagenovese.com:5000/tutees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({matricola: data.matricola, passw: data.password})
        });
        const result2 = await response2.json();

        if (response.ok && response2.ok) {
            alert('Registration successful!');
            localStorage.setItem('user_name', `${data.nome} ${data.cognome}`);
            localStorage.setItem('user_type', 'tutee');
            localStorage.setItem('user_id', data.matricola);
            localStorage.setItem('logged_in', 'true');
            window.location.href = '../tutee/index.html';
        } else {
            if (result.error) {
                alert(result.error);
            } else if (result2.error) {
                alert(result2.error);
            } else {
                alert('An error occurred during registration.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration.');
    }
}