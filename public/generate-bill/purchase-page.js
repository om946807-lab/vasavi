// purchase-page.js

document.addEventListener('DOMContentLoaded', () => {
    const itemTypeSelect = document.getElementById('itemType');
    const itemIdSelect = document.getElementById('itemId');
    const addItemButton = document.getElementById('addItemButton');
    const finalizePurchaseButton = document.getElementById('finalizePurchaseButton');
    const purchaseSummaryBody = document.querySelector('#purchaseSummary tbody');
    let items = [];

    itemTypeSelect.addEventListener('change', async () => {
        const itemType = itemTypeSelect.value;
        if (itemType) {
            try {
                const response = await fetch(`/api/items?itemType=${itemType}`);
                const data = await response.json();
                populateItemIdSelect(data);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        }
    });

    function populateItemIdSelect(items) {
        itemIdSelect.innerHTML = '<option value="">Select Item ID</option>'; // Reset options
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id; // Assuming 'id' is the unique identifier
            option.textContent = item.id; // Display item ID or a description
            itemIdSelect.appendChild(option);
        });
    }

    addItemButton.addEventListener('click', () => {
        const itemType = itemTypeSelect.value;
        const itemId = itemIdSelect.value;
        const itemName = document.getElementById('itemName').value.trim();
        const quantity = parseFloat(document.getElementById('quantity').value);
        const amountPerGram = parseFloat(document.getElementById('amountPerGram').value);
        const makingCharges = parseFloat(document.getElementById('makingCharges').value) || 0;
        const wastage = parseFloat(document.getElementById('wastage').value) || 0;

        if (!itemType || !itemId || !itemName || isNaN(quantity) || isNaN(amountPerGram) || quantity <= 0 || amountPerGram <= 0) {
            alert('Please fill out all required fields correctly.');
            return;
        }

        const adjustedQuantity = quantity + (quantity * (wastage / 100));
        const totalAmount = (amountPerGram * adjustedQuantity) + makingCharges;

        items.push({
            itemType: itemType,
            itemId: itemId,
            itemName: itemName,
            quantity: quantity,
            amountPerGram: amountPerGram,
            totalAmount: totalAmount.toFixed(2)
        });

        const newRow = purchaseSummaryBody.insertRow();
        newRow.innerHTML = `
            <td>${itemType}</td>
            <td>${itemId}</td>
            <td>${itemName}</td>
            <td>${quantity.toFixed(2)}</td>
            <td>$${amountPerGram.toFixed(2)}</td>
            <td>$${totalAmount.toFixed(2)}</td>
            <td><button type="button" class="deleteButton">Delete</button></td>
        `;

        updateTotalAmount();
    });

    purchaseSummaryBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('deleteButton')) {
            const row = event.target.closest('tr');
            const rowIndex = Array.from(purchaseSummaryBody.rows).indexOf(row);
            items.splice(rowIndex, 1);
            row.remove();
            updateTotalAmount();
        }
    });

    finalizePurchaseButton.addEventListener('click', () => {
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const amountPaying = parseFloat(document.getElementById('amountPaying').value) || 0;

        if (!customerName) {
            alert('Please enter the customer name.');
            return;
        }
        if (!customerPhone) {
            alert('Please enter the customer phone number.');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one item to the purchase.');
            return;
        }

        const totalAmount = parseFloat(document.getElementById('totalAmount').textContent.replace('$', '')) || 0;
        const balanceAmount = totalAmount - amountPaying;

        if (balanceAmount < 0) {
            alert('Amount paying cannot exceed the total amount.');
            return;
        }

        document.getElementById('balanceAmountDisplay').textContent = `$${balanceAmount.toFixed(2)}`;

        alert('Purchase finalized successfully!');
        document.getElementById('successMessage').style.display = 'block';
    });

    function updateTotalAmount() {
        let currentTotal = 0;
        items.forEach(item => {
            currentTotal += parseFloat(item.totalAmount);
        });
        document.getElementById('totalAmount').textContent = `$${currentTotal.toFixed(2)}`;
        document.getElementById('balanceAmountDisplay').textContent = `$${(currentTotal - (parseFloat(document.getElementById('amountPaying').value) || 0)).toFixed(2)}`;
    }
});
