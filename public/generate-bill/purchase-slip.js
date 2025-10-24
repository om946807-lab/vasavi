        document.addEventListener('DOMContentLoaded', () => {
            let totalBillAmount = 0;
            let billNumber;
            fetchNextBillNumber();
            function fetchNextBillNumber() {
                fetch('/next-bill-number')
                    .then(response => response.json())
                    .then(data => {
                        billNumber = data.nextBillNumber;
                        document.getElementById('billNumber').textContent += billNumber; // Display the bill number
                    })
                    .catch(error => {
                        console.error('Error fetching bill number:', error);
                        billNumber = 1; // Default to 1 if there's an error
                        document.getElementById('billNumber').textContent += billNumber; // Display default bill number

                    });
            }
            function incrementBillNumber() {
                billNumber += 1;
                // Use this billNumber for your logic
                console.log('Incremented Bill Number:', billNumber);
            }
           // Fetch stock data based on the type (gold/silver)
            async function fetchStockData(type) {
                const response = await fetch(`/view-stock-data${type === 'silver' ? '-silver' : ''}`);
                if (response.ok) {
                    return response.json();
                } else {
                    console.error('Failed to fetch stock data');
                    return [];
                }
            }
            // Fetch item details by type and ID
            async function fetchItemDetails(type, id) {
                const response = await fetch(`/view-stock-data${type === 'silver' ? '-silver' : ''}`);
                if (response.ok) {
                    const items = await response.json();
                    return items.find(item => item.id == id) || null;
                } else {
                    console.error('Failed to fetch item details');
                    return null;
                }
            }
            // Update options in the dropdown for item IDs
            function updateItemIdOptions(items) {
                const itemIdSelect = document.getElementById('itemId');
                itemIdSelect.innerHTML = '<option value="">Select Item ID</option>';
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = item.id;
                    itemIdSelect.appendChild(option);
                });
            }
            function updateItemIdOptions1(items) {
                const itemIdSelect = document.getElementById('massitemId');
                itemIdSelect.innerHTML = '<option value="">Select Item ID</option>';
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = item.id;
                    itemIdSelect.appendChild(option);
                });
            }
            // Event listener for when item type changes (gold/silver)
            document.getElementById('itemType').addEventListener('change', async () => {
                const itemType = document.getElementById('itemType').value;
                if (itemType) {
                    const items = await fetchStockData(itemType);
                    updateItemIdOptions(items);
                }
            });
            // Event listner for when item ID is selected
            document.getElementById('itemId').addEventListener('change', async () => {
                const itemType = document.getElementById('itemType').value;
                const itemId = document.getElementById('itemId').value;

                if (itemType && itemId) {
                    const item = await fetchItemDetails(itemType, itemId);
                    if (item) {
                        document.getElementById('itemName').value = item[itemType === 'gold' ? 'gold_type' : 'silver_type'] || '';
                        document.getElementById('quantity').value = item.quantity || '';
                        document.getElementById('amountPerGram').value = item.amountPerGram || '';
                    }
                }
            });
            // Fetch mass stock data based on item type (gold/silver ornaments)
            async function fetchMassStockData(itemType) {
                const endpoint = itemType === 'silverOrnaments' ? '/view-stock-data-silver-mass' : '/view-stock-data-mass';
                try {
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        return await response.json();
                    } else {
                        console.error('Failed to fetch mass stock data');
                        return [];
                    }
                } catch (error) {
                    console.error('Error fetching mass stock data:', error);
                    return [];
                }
            }
            // Function to fetch item details (gold_type or silver_type) based on the selected item name
            async function fetchMassItemDetails(itemType, itemName) {
                const endpoint = itemType === 'silverOrnaments' ? '/view-stock-data-silver-mass' : '/view-stock-data-mass';
                try {
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const items = await response.json();
                        return items.find(item => item[itemType === 'goldOrnaments' ? 'gold_type' : 'silver_type'] === itemName) || null;
                    } else {
                        console.error('Failed to fetch mass item details');
                        return null;
                    }
                } catch (error) {
                    console.error('Error fetching mass item details:', error);
                    return null;
                }
            }

            // Function to update item name dropdown options dynamically
            function updateMassItemNameOptions(items, itemType) {
                const itemNameSelect = document.getElementById('massItemName');
                itemNameSelect.innerHTML = '<option value="">Select Item Name</option>';
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item[itemType === 'goldOrnaments' ? 'gold_type' : 'silver_type'];
                    option.textContent = item[itemType === 'goldOrnaments' ? 'gold_type' : 'silver_type'];
                    itemNameSelect.appendChild(option);
                });
            }

             // Function to handle item type change and fetch corresponding stock data
            async function handleItemTypeChange() {
                const itemType = document.getElementById('massItemType').value;
                if (itemType) {
                    const items = await fetchMassStockData(itemType);
                    updateMassItemNameOptions(items, itemType);
                    updateItemIdOptions1(items);

                }
            }

             // Event listener for item type change
            document.getElementById('massItemType').addEventListener('change', handleItemTypeChange);

            // Event listener for item name change to auto-fill item details
            document.getElementById('massItemName').addEventListener('change', async () => {
                const itemType = document.getElementById('massItemType').value;
                const itemName = document.getElementById('massItemName').value;

                if (itemType && itemName) {
                    const item = await fetchMassItemDetails(itemType, itemName);
                    if (item) {
                        document.getElementById('massitemId').value = item.id || '';
                        document.getElementById('massQuantity').value = item.quantity || '';
                        document.getElementById('totalQuantity').value = item.quantity || '';

                    }
                }
            });

            function updateAmounts() {
                const discount = parseFloat(document.getElementById('discount').value) || 0;
                const oldGold = parseFloat(document.getElementById('oldGold').value) || 0;
                const oldBalance = parseFloat(document.getElementById('oldBalance').value) || 0;
                const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
                const balanceAmount = totalBillAmount + oldBalance - discount - amountPaid - oldGold;

                document.getElementById('balanceAmount').textContent = `₹${balanceAmount.toFixed(2)}`;
            }
            function showWarning(message) {
    // Remove existing modal if any
    const existingModal = document.getElementById("warning-modal");
    if (existingModal) existingModal.remove();

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "warning-modal";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0, 0, 0, 0.6)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "10000";
    overlay.style.animation = "fadeIn 0.3s ease-in-out";

    // Create modal box with glassmorphism effect
    const modal = document.createElement("div");
    modal.style.background = "rgba(255, 255, 255, 0.2)";
    modal.style.backdropFilter = "blur(12px)";
    modal.style.color = "#fff";
    modal.style.padding = "30px";
    modal.style.borderRadius = "15px";
    modal.style.boxShadow = "0px 10px 30px rgba(0, 0, 0, 0.3)";
    modal.style.textAlign = "center";
    modal.style.fontSize = "18px";
    modal.style.fontFamily = "'Poppins', sans-serif";
    modal.style.maxWidth = "400px";
    modal.style.position = "relative";
    modal.style.border = "1px solid rgba(255, 255, 255, 0.3)";
    modal.style.animation = "popUp 0.3s ease-out forwards";

    // Warning Icon
    const warningIcon = document.createElement("div");
    warningIcon.innerHTML = "⚠️";
    warningIcon.style.fontSize = "50px";
    warningIcon.style.marginBottom = "15px";
    warningIcon.style.animation = "bounce 1s infinite";
    modal.appendChild(warningIcon);

    // Warning Text
    const warningText = document.createElement("p");
    warningText.innerText = message;
    warningText.style.marginBottom = "20px";
    warningText.style.fontSize = "18px";
    warningText.style.color = "#f8f8f8";
    warningText.style.lineHeight = "1.6";
    modal.appendChild(warningText);

    // OK Button
    const okButton = document.createElement("button");
    okButton.innerText = "OK";
    okButton.style.background = "linear-gradient(135deg, #ff7e5f, #feb47b)";
    okButton.style.color = "#fff";
    okButton.style.border = "none";
    okButton.style.padding = "12px 28px";
    okButton.style.borderRadius = "30px";
    okButton.style.cursor = "pointer";
    okButton.style.fontSize = "16px";
    okButton.style.fontWeight = "600";
    okButton.style.boxShadow = "0 4px 15px rgba(255, 126, 95, 0.4)";
    okButton.style.transition = "all 0.3s ease-in-out";
    
    okButton.onmouseover = () => {
        okButton.style.transform = "scale(1.05)";
        okButton.style.boxShadow = "0 6px 20px rgba(255, 126, 95, 0.5)";
    };
    okButton.onmouseleave = () => {
        okButton.style.transform = "scale(1)";
        okButton.style.boxShadow = "0 4px 15px rgba(255, 126, 95, 0.4)";
    };

    okButton.onclick = () => {
        document.body.removeChild(overlay);
    };

    modal.appendChild(okButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Allow pressing Enter to confirm
    document.addEventListener("keydown", function handleKeyPress(event) {
        if (event.key === "Enter") {
            document.body.removeChild(overlay);
            document.removeEventListener("keydown", handleKeyPress);
        }
    });
}

// Add Soft Animations
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes popUp {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }
`;
document.head.appendChild(styleSheet);


            window.addItem = () => {
                const itemType = document.getElementById('itemType').value;
                const itemId = document.getElementById('itemId').value;
                const itemName = document.getElementById('itemName').value;
                const quantity = parseFloat(document.getElementById('quantity').value);
                const stoneWeight = parseFloat(document.getElementById('stoneWeight').value)||0;
                const amountPerGram = parseFloat(document.getElementById('amountPerGram').value);
                const makingCharges = parseFloat(document.getElementById('makingCharges').value);
                const wastage = parseFloat(document.getElementById('wastage').value) || 0;
                const itemDescription = document.getElementById('itemDescription').value;

                if (isNaN(quantity) || isNaN(amountPerGram) || isNaN(makingCharges) || quantity <= 0 || amountPerGram <= 0) {
                    showWarning('Please enter valid values for quantity, amount per gram, and making charges.');
                    return;
                }

                const adjustedQuantity = (quantity-stoneWeight) + ((quantity-stoneWeight) * (wastage / 100));
                const totalAmount = (amountPerGram * adjustedQuantity) + makingCharges;

                const billSummary = document.getElementById('billSummary').getElementsByTagName('tbody')[0];
                const newRow = billSummary.insertRow();
                newRow.innerHTML = `
                    <td>${itemType}</td>
                    <td>${itemId}</td>
                    <td>${itemName}${itemDescription ? `<br> - <small>${itemDescription}</small>` : ''}</td>
                    <td>${quantity.toFixed(2)}</td>
                    <td>${stoneWeight.toFixed(2)}</td>
                    <td>${wastage.toFixed(2)}</td>
                    <td>₹${amountPerGram.toFixed(2)}</td>
                    <td>₹${makingCharges.toFixed(2)}</td>
                    <td>₹${totalAmount.toFixed(2)}</td>
                    <td><button type="button" class="deleteButton">Delete</button></td>
                `;
                totalBillAmount += totalAmount;
                document.getElementById('totalBillAmount').textContent = `₹${totalBillAmount.toFixed(2)}`;
                updateAmounts();

                document.getElementById('itemType').value = '';
                updateItemIdOptions([]);
                document.getElementById('itemName').value = '';
                document.getElementById('quantity').value = '';
                document.getElementById('stoneWeight').value = '';
                document.getElementById('amountPerGram').value = '';
                document.getElementById('makingCharges').value = '';
                document.getElementById('wastage').value = '';
                document.getElementById('itemDescription').value = '';
            };
            window.addMassItem = () => {
                const itemType = document.getElementById('massItemType').value;
                const itemId = document.getElementById('massitemId').value; // Reusing the same ID field for mass items
                const itemName = document.getElementById('massItemName').value;
                const quantity = parseFloat(document.getElementById('massQuantity').value);
                const stoneWeight = parseFloat(document.getElementById('massStoneWeight').value)||0;
                const amountPerGram = parseFloat(document.getElementById('massAmountPerGram').value);
                const makingCharges = parseFloat(document.getElementById('massMakingCharges').value);
                const wastage = parseFloat(document.getElementById('massWastage').value) || 0;
                const itemDescription = document.getElementById('massItemDescription').value;

                if (isNaN(quantity) || isNaN(amountPerGram) || isNaN(makingCharges) || quantity <= 0 || amountPerGram <= 0) {
                    showWarning('Please enter valid values for quantity, amount per gram, and making charges.');
                    return;
                }

                const adjustedQuantity = (quantity-stoneWeight) + ((quantity-stoneWeight) * (wastage / 100));
                const totalAmount = (amountPerGram * adjustedQuantity) + makingCharges;

                const billSummary = document.getElementById('billSummary').getElementsByTagName('tbody')[0];
                const newRow = billSummary.insertRow();
                newRow.innerHTML = `
                    <td>${itemType}</td>
                    <td>${itemId}</td>
                    <td>${itemName}${itemDescription ? `<br> - <small>${itemDescription}</small>` : ''}</td>
                    <td>${quantity.toFixed(2)}</td>
                    <td>${stoneWeight.toFixed(2)}</td>
                    <td>${wastage.toFixed(2)}</td>
                    <td>₹${amountPerGram.toFixed(2)}</td>
                    <td>₹${makingCharges.toFixed(2)}</td>
                    <td>₹${totalAmount.toFixed(2)}</td>
                    <td><button type="button" class="deleteButton">Delete</button></td>
                `;

                totalBillAmount += totalAmount;
                document.getElementById('totalBillAmount').textContent = `₹${totalBillAmount.toFixed(2)}`;
                updateAmounts();

                // Clear the input fields for the next item entry
                document.getElementById('massItemType').value = '';
                document.getElementById('massItemName').value = '';
                document.getElementById('massitemId').value = '';
                document.getElementById('massStoneWeight').value = '';
                document.getElementById('massQuantity').value = '';
                document.getElementById('massAmountPerGram').value = '';
                document.getElementById('massMakingCharges').value = '';
                document.getElementById('massWastage').value = '';
                document.getElementById('massItemDescription').value = '';
            };

            document.getElementById('billSummary').addEventListener('click', (event) => {
                if (event.target.classList.contains('deleteButton')) {
                    const row = event.target.closest('tr');
                    const totalAmount = parseFloat(row.cells[8].textContent.replace('₹', ''));

                    totalBillAmount -= totalAmount;
                    document.getElementById('totalBillAmount').textContent = `₹${totalBillAmount.toFixed(2)}`;
                    updateAmounts();

                    row.remove();
                }
            });

            document.getElementById('updateButton').addEventListener('click', () => {
                const discount = parseFloat(document.getElementById('discount').value) || 0;
                const oldGold = parseFloat(document.getElementById('oldGold').value) || 0;
                const oldBalance = parseFloat(document.getElementById('oldBalance').value) || 0;
                const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
                const balanceAmount = totalBillAmount + oldBalance - discount - amountPaid - oldGold;

                document.getElementById('balanceAmount').textContent = `₹${balanceAmount.toFixed(2)}`;
            });


            document.getElementById('printButton').addEventListener('click', async () => {
                const customerName = document.getElementById('customerName').value.trim();
                const customerPhone = document.getElementById('customerPhone').value.trim();
                const billSummary = document.getElementById('billSummary').getElementsByTagName('tbody')[0];
                const itemRows = billSummary.getElementsByTagName('tr').length;
                const discount = parseFloat(document.getElementById('discount').value) || 0;
                const oldBalance = parseFloat(document.getElementById('oldBalance').value) || 0;
                const oldGold = parseFloat(document.getElementById('oldGold').value) || 0;
                const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
                const balanceAmount = totalBillAmount - discount - amountPaid-oldGold+oldBalance;

                if (!customerName) {
                    showWarning('Please enter the customer name.');
                    return;
                }
                if (!customerPhone) {
                    showWarning('Please enter the customer phone number.');
                    return;
                }
                if (itemRows === 0 || isNaN(discount) || discount < 0 || isNaN(amountPaid) ||isNaN(oldGold)|| amountPaid < 0) {
                    showWarning('Add atleast one item or check the inputs.');
                    return;
                }

                const items = Array.from(billSummary.rows).map(row => ({
                    itemType: row.cells[0].textContent,
                    itemId: row.cells[1].textContent,
                    itemName: row.cells[2].textContent,
                    quantity: row.cells[3].textContent,
                    stoneWeight: row.cells[4].textContent,
                    wastage:row.cells[5].textContent,
                    amountPerGram: row.cells[6].textContent,
                    makingCharges: row.cells[7].textContent, // Include making charges
                    totalPrice: parseFloat(row.cells[8].textContent.replace('₹', '')),
                    itemDescription: row.cells[2].querySelector('small') ? row.cells[2].querySelector('small').textContent : ''
                }));

                try {
                    const response = await fetch('/generate-bill', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            billNumber: billNumber,
                            customerName,
                            customerPhone,
                            items,
                            subtotal: totalBillAmount,
                            discount,
                            oldGold,
                            oldBalance,
                            amountPaid,
                            balanceAmount: balanceAmount > 0 ? balanceAmount : 0
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log(result.message);
                        const successMessage = document.getElementById('successMessage');
                        successMessage.style.display = 'block';

                        setTimeout(() => {
                            successMessage.style.display = 'none';
                            window.open(`purchase-print-bill.html?billNumber=${billNumber}`, '_blank');
                            location.reload();
                        }, 2000);

                        totalBillAmount = 0;
                        document.getElementById('totalBillAmount').textContent = `₹0.00`;
                        document.getElementById('balanceAmount').textContent = `₹0.00`;
                        billSummary.innerHTML = '';
                    } else {
                        console.error('Failed to generate bill');
                    }
                } catch (error) {
                    console.error('Error generating bill:', error);
                }
            });
        });

            function toggleForms() {
                const isMassItem = document.getElementById('massEntrySwitch').checked;
                document.getElementById('singleItemForm').style.display = isMassItem ? 'none' : 'block';
                document.getElementById('massItemForm').style.display = isMassItem ? 'block' : 'none';
            }