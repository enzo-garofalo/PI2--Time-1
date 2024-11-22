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

async function showAlert(message, type){
    const alertContainer = document.getElementById('alert-box');

    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick="location.reload()"></button>
        `;
    alertContainer.classList.remove('d-none');
}


async function newUserRequest(){
    var name = document.getElementById("fName").value.trim();
    var email = document.getElementById("fEmail").value.trim();
    var password = document.getElementById("fPassword").value.trim();
    var birthdate = document.getElementById("fBirthdate").value.trim();
    const submitButton = document.getElementById("button-submit");

    try{
        // Verifica se todos os campos foram preenchidos
        if (!name || !email || !password || !birthdate) {
            alert("Please fill in all fields!");
            return;
        }

        submitButton.disabled = true;

        const reqHeaders = new Headers();
        reqHeaders.append("name", name);
        reqHeaders.append("email", email);
        reqHeaders.append("password", password);
        reqHeaders.append("birthdate", birthdate);

        const newUser = await fetch("http://127.0.0.1:3000/signUp", {
        method: "PUT",
        headers: reqHeaders,
        });

        const messageSignUp = await newUser.text();
        if(newUser.ok){
            showAlert(messageSignUp,'success')
            window.location.href="login.html"
        }
        else{
            showAlert(messageSignUp,'danger')
        }
    
    }    
    catch(error){
        showAlert(messageSignUp,'warning')
        console.error(error);
    }
    finally{
        submitButton.disabled = false;
    }
}