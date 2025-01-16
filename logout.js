async function handleLogout() {
    try {
        const response = await fetch('http://peertopeer.martagenovese.com:5000/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_type');
            localStorage.removeItem('user_id');
            localStorage.setItem('logged_in', 'false');
            window.location.href = './index.html';
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}