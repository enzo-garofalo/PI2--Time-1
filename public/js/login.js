function showMessage(content, type) {
    const alertBox = document.getElementById('alert-box');
    const alertMessage = document.getElementById('alert-message');
    
    alertMessage.innerHTML = content;
    
    // Exibe o alerta
    alertBox.classList.remove('d-none');
    alertBox.classList.add('show');
}

// Função para esconder a mensagem
function hideMessage() {
    const mb = document.getElementById('message-box');
    mb.classList.remove('show');
    mb.classList.add('hide');
}

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
            showMessage(errorMessage, 'error');
        }
    }
}
// Função de cadastro
async function signUp() {
    var name = document.getElementById('fName').value;
    var email = document.getElementById('fEmail').value;
    var password = document.getElementById('fPassword').value;
    var birthdate = document.getElementById('fBirthdate').value;

    if (isValidSignUp(name, email, password, birthdate)) {
        const signUpData = new Headers();
        signUpData.append('name', name);
        signUpData.append('email', email);
        signUpData.append('password', password);
        signUpData.append('birthdate', birthdate);

        const res = await fetch(
            'http://127.0.0.1:3000/signUp', {
                method: 'PUT',
                headers: signUpData,
                credentials: 'include' // Necessário para enviar cookies entre cliente e servidor
            }
        );

        if (res.ok) {
            window.location.href = '../view/home.html';
        } else {
            const errorMessage = await res.text(); // Lê o erro retornado do servidor
            showMessage(errorMessage, 'error');
        }
    }
}
