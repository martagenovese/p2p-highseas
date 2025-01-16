async function handleLogin(event, userType) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('http://peertopeer.martagenovese.com:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('user_name', `${result.nome} ${result.cognome}`);
            localStorage.setItem('user_type', userType);
            localStorage.setItem('user_id', formData.get('username'));
            localStorage.setItem('logged_in', 'true');
            if (userType === 'tutor') {
                window.location.href = './tutor/index.html';
            } else if (userType === 'tutee') {
                window.location.href = './tutee/index.html';
            } else if (userType === 'admin') {
                window.location.href = './admin/index.html';
            } else if (userType === 'centralino') {
                window.location.href = './centralino/index.html';
            }
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

document.getElementById('tutor-login-form').addEventListener('submit', (event) => handleLogin(event, 'tutor'));
document.getElementById('tutee-login-form').addEventListener('submit', (event) => handleLogin(event, 'tutee'));
document.getElementById('admin-login-form').addEventListener('submit', (event) => handleLogin(event, 'admin'));
document.getElementById('centralino-login-form').addEventListener('submit', (event) => handleLogin(event, 'centralino'));
