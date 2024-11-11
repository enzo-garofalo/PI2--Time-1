function showMessage(content, type) {
    const mb = document.getElementById('message-box');
    const message = document.getElementById('message');
    
    message.innerHTML = content;
    
    // Verifica se o box já está visível, para evitar alterações desnecessárias no display
    if (mb.style.display !== 'block') {
        mb.style.display = 'block';
        mb.classList.remove('hide'); // Caso a mensagem anterior tenha sido ocultada
        mb.classList.add('show');
    }
    
    switch(type) {
        case 'error':
            mb.style.backgroundColor = 'darkred';
            mb.style.borderColor = 'rgb(189, 76, 76)';
            break;

        case 'success':
            mb.style.backgroundColor = 'darkgreen';
            mb.style.borderColor = 'green';
            break;
    }
}

// Função para esconder a mensagem
function hideMessage() {
    const mb = document.getElementById('message-box');
    mb.classList.remove('show');
    mb.classList.add('hide');
    setTimeout(() => {
        mb.style.display = 'none';
    }, 300); // Espera a animação desaparecer antes de esconder
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

// Validação para cadastro
function isValidSignUp(name, email, password, birthdate) {
    var valid = false;
    if (name.length > 0 && email.length > 0 && password.length > 0 && birthdate.length > 0) {
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
        loginData.append('email', email);
        loginData.append('password', password);

        const res = await fetch(
            'http://192.168.1.2:3000/login', {
                method: 'POST',
                headers: loginData
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
            'http://192.168.1.2:3000/signUp', {
                method: 'PUT',
                headers: signUpData
            }
        );

        if (res.ok) {
            window.location.href = './home.html';
        } else {
            const errorMessage = await res.text(); // Lê o erro retornado do servidor
            showMessage(errorMessage, 'error');
        }
    }
}
