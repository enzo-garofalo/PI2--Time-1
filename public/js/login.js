function showMessage(content, type){
    document.getElementById('message').innerHTML = content;
    var mb = document.getElementById('message-box');
    mb.style.display = 'block';
    
    switch(type){
        case 'error':
            mb.style.backgroundColor = 'darkred';
            mb.style.borderColor = 'rgb(189, 76, 76)'
        break;

        case 'success':
            mb.style.backgroundColor = 'darkgreen';
            mb.style.borderColor = 'green';
        break;
    }
}
        
function hideMessage(){
    var mb = document.getElementById('message-box');
    mb.style.display = 'none';        
}

function isValid(email, password){
    var valid = false;
    if(email.length > 0 && password.length > 0){
        valid = true;
    }else{
        showMessage('Please fill out all the fields', 'error');
    }
    return valid;
}

function isValidSignUp(name, email, password, birthdate){
    var valid = false;
    if(name.length > 0 && email.length > 0 && password.length > 0 && birthdate.length>0){
        valid = true;
    }else{
        showMessage('Please fill out all the fields', 'error');
    }
    return valid;
}

async function signIn(){

    var email = document.getElementById('fEmail').value;
    var password = document.getElementById('fPassword').value;    
    
    if(isValid(email, password)){
        const loginData = new Headers();
        loginData.append('email', email);
        loginData.append('password', password);
    
        const res = await fetch(
            // configurar o fetch para o seu IP
            'http://192.168.102.110:3000/login',{
                method: 'POST',
                headers: loginData
            }
        );
    
        if(res.ok){
            window.location.href = '../view/home.html';
        }else{
            const errorMessage = await res.text(); // Lê o erro retornado do servidor
            showMessage(errorMessage, 'error');
        }
    }
}

async function signUp() {

    var name = document.getElementById('fName').value;
    var email = document.getElementById('fEmail').value;
    var password = document.getElementById('fPassword').value;
    var birthdate = document.getElementById('fBirthdate').value;

    if(isValidSignUp(name, email, password, birthdate)){
        const signUpData = new Headers();
        signUpData.append('name', name);
        signUpData.append('email', email);
        signUpData.append('password', password);
        signUpData.append('birthdate', birthdate);


        const res = await fetch(
            'http://192.168.102.110:3000/signUp',{
                method: 'PUT',
                headers: signUpData
            }
        );
    
        if(res.ok){
            window.location.href = './home.html';
        }else{
            const errorMessage = await res.text(); // Lê o erro retornado do servidor
            showMessage(errorMessage, 'error');
        }
    }
}