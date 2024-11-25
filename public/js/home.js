async function hideShow(balance) {
    //função para apresentar na home o balance
    //tem código que virá de funds.ts
    //ver como fazer no exemplo do mateus do código dele da tabela
    //tanto para Balance como para o histórico das transações
    
}


document.getElementById("showHideBalance").addEventListener("click", () => {
    const iconElement = document.getElementById("showHideBalance");
    const buttonElement = document.getElementById("showHideBalance");

    // Verifica o estado atual do ícone
    if (iconElement.classList.contains("fa-eye")) {
        // Altera para "olho fechado"
        iconElement.className = "fas fa-eye-slash";
        //buttonElement.textContent = " Hide Balance";
        buttonElement.prepend(iconElement); // Reinsere o ícone no botão
    } else {
        // Altera para "olho aberto"
        iconElement.className = "fas fa-eye";
        //buttonElement.textContent = " Show Balance";
        buttonElement.prepend(iconElement); // Reinsere o ícone no botão
    }
});
