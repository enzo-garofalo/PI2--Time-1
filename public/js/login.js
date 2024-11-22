import { showAlert } from './signup.js'


// Validação para login
function isValid(email, password) {
    var valid = false;
    if (email.length > 0 && password.length > 0) {
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
        } else {
            valid = true;
        }
    } else {
        showMessage('Please fill out all the fields', 'error');
    }
    return valid;
}

// Função para validar o formato do email usando regex
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
}

// Função de login
async function signIn() {
    var email = document.getElementById('fEmail').value;
    var password = document.getElementById('fPassword').value;    

    if (isValid(email, password)) {
        const loginData = new Headers();
        loginData.append("Content-Type", "application/json");
        loginData.append("Connection", "Keep-alive");
        loginData.append('email', email);
        loginData.append('password', password);

        const res = await fetch(
            'http://127.0.0.1:3000/login', {
                method: 'POST',
                headers: loginData,
                credentials: 'include'
            }
        );

        if (res.ok) {
            // Aqui redireciona se o login estiver correto
            window.location.href = '../view/home.html';
        } else {
            const errorMessage = await res.text(); // Lê o erro retornado do servidor
            // showMessage(errorMessage, 'error');
            showAlert(errorMessage,'warning');
        }
    }
}