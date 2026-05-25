document.getElementById('emailForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const messageBox = document.getElementById('formMessage');
    
    if(email) {
        messageBox.textContent = `✨ Спасибо! ${email}, вы будете в курсе запуска.`;
        messageBox.style.color = '#AEC6CF';
        document.getElementById('emailInput').value = '';
        setTimeout(() => {
            messageBox.textContent = '';
        }, 5000);
    }
});