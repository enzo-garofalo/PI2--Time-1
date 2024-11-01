const { error } = require("console");

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

async function signIn(){

    var email = document.getElementById('fEmail').value;
    var password = document.getElementById('fPassword').value;    
    
    if(isValid(email, password)){
        const loginData = new Headers();
        loginData.append('email', email);
        loginData.append('password', password);
    
        const res = await fetch(
            'http://192.168.1.9:3000/login',{
                method: 'POST',
                headers: loginData
            }
        );
    
        if(res.ok){
            showMessage('Login efetuado!', 'success');
        }else{
            const errorMessage = await res.text(); // Lê o erro retornado do servidor
            showMessage(errorMessage, 'error');
        }
    }
}