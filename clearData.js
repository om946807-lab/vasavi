function submitAdvance() {
    const amountInput = document.getElementById('advanceAmount');
    const errorBox = document.getElementById('advanceError');
    const amount = parseFloat(amountInput.value);

    errorBox.style.display = 'none';

    if (isNaN(amount) || amount <= 0) {
        errorBox.innerText = '⚠️ Please enter a valid amount.';
        errorBox.style.display = 'block';
        return;
    }

    if (amount > currentBalance) {
        errorBox.innerText = '⚠️ Amount exceeds remaining balance.';
        errorBox.style.display = 'block';
        return;
    }

    fetch('/make-advance-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrderId, amount })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAdvanceModal();
                showPaymentSuccessModal(); // ✅ Show success modal
            } else {
                errorBox.innerText = '❌ ' + data.error;
                errorBox.style.display = 'block';
            }
        })
        .catch(err => {
            console.error(err);
            errorBox.innerText = '❌ Something went wrong.';
            errorBox.style.display = 'block';
        });
}
