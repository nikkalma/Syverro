// EVEBRARY-LANDING-SCRIPT-001
const scriptURL = 'https://script.google.com/macros/s/AKfycbyt4qmYJInW8SuDKuWsf2mVy-E13uFFsVCGwlkoMYs2skEFmO2lBGDk53tvzu_F95z2/exec';

const form = document.getElementById('emailForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();
    const messageBox = document.getElementById('formMessage');
    
    if (!email) {
        messageBox.textContent = '❌ Введите email';
        messageBox.style.color = '#ff4444';
        return;
    }
    
    const submitBtn = form.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    try {
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, source: 'landing' })
        });
        
        messageBox.textContent = '✨ Спасибо! Вы в списке ожидания.';
        messageBox.style.color = '#AEC6CF';
        emailInput.value = '';
        
        setTimeout(() => {
            messageBox.textContent = '';
        }, 5000);
    } catch (error) {
        messageBox.textContent = '❌ Ошибка. Попробуйте позже.';
        messageBox.style.color = '#ff4444';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Notify me';
    }
});