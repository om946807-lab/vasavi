// --- Import Icons (Simulated as they are not standard JS features) ---
const ICONS = {
    ArrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
    Search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    Eye: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    CreditCard: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    History: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 16 5.5l-2.4-2.4"/><path d="M12 7v5l3 3"/></svg>`,
    FileText: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="10" x2="15" y1="13" y2="13"/><line x1="10" x2="15" y1="17" y2="17"/><line x1="10" x2="12" y1="9" y2="9"/></svg>`,
    MoreVertical: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-vertical text-slate-600"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
    X: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
};

// --- State Management ---
let state = {
    bills: [],
    searchTerm: '',
    totalBalance: 0,
    selectedBill: null, // For mobile card expansion
    itemsModal: { open: false, items: [] },
    historyModal: { open: false, history: [] },
    paymentModal: { open: false, bill: null },
    confirmModal: { open: false, amount: 0 },
    successModal: { open: false, amount: 0, customerName: '' },
};

const appRoot = document.getElementById('app-root');
const modalContainer = document.getElementById('modal-container');

// Function to update state and trigger re-render
const setState = (newState) => {
    state = { ...state, ...newState };
    renderApp();
};

// --- Utility Functions ---

const createElement = (tag, classes = '', content = '', attributes = {}) => {
    const element = document.createElement(tag);
    if (classes) element.className = classes;
    if (content) element.innerHTML = content;
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
};

const formatNumber = (num) => {
    const safeNum = typeof num === 'number' ? num : parseFloat(num) || 0;
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safeNum);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
};

const filteredBills = () => {
    return state.bills.filter(bill =>
        Object.values(bill).some(value =>
            value !== null && value !== undefined && value.toString().toLowerCase().includes(state.searchTerm.toLowerCase())
        )
    );
};

// --- API Functions (Core logic) ---

const fetchBills = async () => {
    try {
        // NOTE: Replace with your actual API endpoint
        const response = await fetch('/bills'); 
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        if (data.bills && Array.isArray(data.bills)) {
            const balanceBills = data.bills.filter((bill) => bill.balance_amount > 0);
            const total = balanceBills.reduce((sum, bill) => sum + parseFloat(bill.balance_amount || 0), 0);
            setState({ bills: balanceBills, totalBalance: total });
        }
    } catch (error) {
        console.error('Error fetching bills:', error);
    }
};

const showItems = async (billNumber) => {
    try {
        const response = await fetch(`/bill-items/${billNumber}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setState({ itemsModal: { open: true, items: data.items || [] } });
    } catch (error) {
        console.error('Error fetching bill items:', error);
    }
};

const showHistory = async (billNumber) => {
    try {
        const response = await fetch(`/payment-history/${billNumber}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setState({ historyModal: { open: true, history: data.subBills || [] } });
    } catch (error) {
        console.error('Error fetching payment history:', error);
    }
};

const openPaymentModal = (bill) => {
    // Ensure balance_amount is treated as a number
    bill.balance_amount = parseFloat(bill.balance_amount);
    setState({ paymentModal: { open: true, bill } });
};

const handlePayment = (amount) => {
    if (!state.paymentModal.bill) return;
    // Clear the paymentModal state immediately to ensure the next confirm step doesn't rely on it
    setState({ 
        paymentModal: { open: false, bill: null }, 
        confirmModal: { open: true, amount: amount } 
    });
};

const confirmPayment = async () => {
    const billToPay = state.bills.find(b => b.bill_number === state.confirmModal.billNumber);
    const { amount } = state.confirmModal;
    
    // We rely on confirmModal's data since paymentModal might have been cleared
    if (amount <= 0 || !state.confirmModal.customerName) return; 

    try {
        const response = await fetch(`/pay-bill/${state.confirmModal.billNumber}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount_paid: amount })
        });
        const resBody = await response.json();

        if (response.ok && resBody.message === 'Payment successful') {
            setState({
                confirmModal: { open: false, amount: 0, billNumber: null, customerName: '' },
                successModal: { open: true, amount: amount, customerName: state.confirmModal.customerName }
            });

            setTimeout(() => {
                setState({ successModal: { open: false, amount: 0, customerName: '' } });
                fetchBills(); // Refresh list after success
            }, 3000);
        } else {
            alert(resBody.error || 'Payment failed');
            setState({ confirmModal: { open: false, amount: 0, billNumber: null, customerName: '' } });
        }
    } catch (err) {
        alert('Payment failed');
        setState({ confirmModal: { open: false, amount: 0, billNumber: null, customerName: '' } });
    }
};

const viewBill = (billNumber) => {
    window.open(`/generate-bill/purchase-print-bill.html?billNumber=${billNumber}`, '_blank');
};

// --- Rendering Functions ---

const renderHeader = () => {
    const header = createElement('header', 'bg-white shadow-lg sticky top-0 z-40 border-b border-slate-200');
    const container = createElement('div', 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6');
    header.appendChild(container);

    // Top Row
    const topRow = createElement('div', 'flex items-center justify-between mb-4');
    
    // Back Button
    const backButton = createElement('button', 'flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md', ICONS.ArrowLeft + '<span class="hidden sm:inline">Back</span>');
    backButton.onclick = () => window.history.back();

    // Title
    const title = createElement('h1', 'text-2xl sm:text-3xl font-bold text-slate-800', 'Balance Bills');
    const spacer = createElement('div', 'w-20 sm:w-24'); // Spacer for alignment
    topRow.append(backButton, title, spacer);

    // Search Bar
    const searchDiv = createElement('div', 'relative');
    const searchIcon = createElement('div', 'absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400', ICONS.Search);
    const searchInput = createElement('input', 'w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all', '', {
        type: 'text',
        placeholder: 'Search bills...',
        value: state.searchTerm
    });
    searchInput.oninput = (e) => setState({ searchTerm: e.target.value });
    searchDiv.append(searchIcon, searchInput);

    container.append(topRow, searchDiv);
    return header;
};

const renderMainContent = () => {
    const container = createElement('div', 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6');

    // Total Balance Card
    const balanceCard = createElement('div', 'mb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-xl');
    balanceCard.innerHTML = `<p class="text-sm sm:text-base opacity-90 mb-1">Total Balance</p><p class="text-3xl sm:text-4xl font-bold">₹${formatNumber(state.totalBalance)}</p>`;
    container.appendChild(balanceCard);

    const bills = filteredBills();

    // Desktop Table View
    const desktopTable = renderDesktopTable(bills);
    container.appendChild(desktopTable);

    // Mobile Card View
    const mobileCards = renderMobileCards(bills);
    container.appendChild(mobileCards);

    return container;
};

const renderDesktopTable = (bills) => {
    const wrapper = createElement('div', 'hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden');
    const tableWrapper = createElement('div', 'overflow-x-auto');
    const table = createElement('table', 'w-full');

    const thead = createElement('thead', 'bg-slate-100 border-b-2 border-slate-200');
    const headers = ['Bill #', 'Customer', 'Phone', 'Date', 'Subtotal', 'Discount', 'Paid', 'Old Gold', 'Old Balance', 'Balance', 'Actions'];
    let headerRow = createElement('tr');
    headers.forEach(text => {
        const isRight = ['Subtotal', 'Discount', 'Paid', 'Old Gold', 'Old Balance', 'Balance'].includes(text);
        const isCenter = text === 'Actions';
        headerRow.appendChild(createElement('th', `px-4 py-4 text-${isRight ? 'right' : isCenter ? 'center' : 'left'} text-xs font-bold text-slate-700 uppercase tracking-wider`, text));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createElement('tbody', 'divide-y divide-slate-100');
    bills.forEach(bill => {
        const row = createElement('tr', 'hover:bg-slate-50 transition-colors');
        
        const data = [
            bill.bill_number, bill.customer_name, bill.customer_phone, formatDate(bill.bill_date), 
            formatNumber(bill.subtotal), formatNumber(bill.discount), formatNumber(bill.amount_paid), 
            formatNumber(bill.oldGold), formatNumber(bill.old_balance), formatNumber(bill.balance_amount)
        ];

        data.forEach((text, index) => {
            const isRight = index >= 4;
            const isBalance = index === 9;
            const className = `px-4 py-4 text-sm text-${isRight ? 'right' : 'left'} ${isBalance ? 'font-bold text-blue-600' : index === 0 ? 'font-semibold text-slate-800' : 'text-slate-700'}`;
            const prefix = isRight ? '₹' : '';
            row.appendChild(createElement('td', className, prefix + text));
        });

        // Actions cell
        const actionsTd = createElement('td', 'px-4 py-4');
        const actionsDiv = createElement('div', 'flex gap-2 justify-center flex-wrap');

        const createActionButton = (iconHtml, title, onClick, color) => {
            const button = createElement('button', `p-2 bg-${color}-50 hover:bg-${color}-100 text-${color}-600 rounded-lg transition-colors`, iconHtml, { title: title });
            button.onclick = onClick;
            return button;
        };

        actionsDiv.append(
            createActionButton(ICONS.Eye.replace('18', '18'), 'View Items', () => showItems(bill.bill_number), 'blue'),
            createActionButton(ICONS.CreditCard.replace('18', '18'), 'Pay Balance', () => openPaymentModal(bill), 'green'),
            createActionButton(ICONS.History.replace('18', '18'), 'View History', () => showHistory(bill.bill_number), 'orange'),
            createActionButton(ICONS.FileText.replace('18', '18'), 'Print Bill', () => viewBill(bill.bill_number), 'slate'),
        );
        actionsTd.appendChild(actionsDiv);
        row.appendChild(actionsTd);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    wrapper.appendChild(tableWrapper);
    return wrapper;
};

const renderMobileCards = (bills) => {
    const wrapper = createElement('div', 'md:hidden space-y-4');

    bills.forEach(bill => {
        const card = createElement('div', 'bg-white rounded-xl shadow-lg p-5 relative');

        const headerFlex = createElement('div', 'flex justify-between items-start mb-4');
        const infoDiv = createElement('div', 'flex-1');
        infoDiv.append(
            createElement('div', 'text-xs font-bold text-slate-500 uppercase mb-1', `Bill #${bill.bill_number}`),
            createElement('div', 'text-lg font-bold text-slate-800', bill.customer_name),
            createElement('div', 'text-sm text-slate-600', bill.customer_phone)
        );

        const toggleButton = createElement('button', 'p-2 hover:bg-slate-100 rounded-lg transition-colors', ICONS.MoreVertical);
        toggleButton.onclick = () => setState({ selectedBill: state.selectedBill === bill.bill_number ? null : bill.bill_number });
        
        headerFlex.append(infoDiv, toggleButton);

        const balanceFlex = createElement('div', 'flex justify-between items-center mb-4');
        balanceFlex.append(
            createElement('span', 'text-sm text-slate-600', `Date: ${formatDate(bill.bill_date)}`),
            createElement('span', 'text-xl font-bold text-blue-600', `₹${formatNumber(bill.balance_amount)}`)
        );
        
        card.append(headerFlex, balanceFlex);

        // Detailed view (collapsible)
        if (state.selectedBill === bill.bill_number) {
            const detailsDiv = createElement('div', 'border-t border-slate-200 pt-4 mt-4 space-y-3 animate-fadeIn');
            
            // Stats Grid
            const gridDetails = createElement('div', 'grid grid-cols-2 gap-3 text-sm');
            const detailItems = [
                { label: 'Subtotal', value: formatNumber(bill.subtotal) },
                { label: 'Discount', value: formatNumber(bill.discount) },
                { label: 'Paid', value: formatNumber(bill.amount_paid) },
                { label: 'Old Gold', value: formatNumber(bill.oldGold) },
                { label: 'Old Balance', value: formatNumber(bill.old_balance) }
            ];

            detailItems.forEach(item => {
                const detail = createElement('div');
                detail.append(
                    createElement('span', 'text-slate-500', `${item.label}:`),
                    createElement('span', 'ml-2 font-semibold text-slate-700', `₹${item.value}`)
                );
                gridDetails.appendChild(detail);
            });

            // Action Buttons Grid
            const gridActions = createElement('div', 'grid grid-cols-2 gap-2 pt-3');
            const createMobileActionButton = (iconHtml, text, onClick, color) => {
                const button = createElement('button', `flex items-center justify-center gap-2 px-3 py-2 bg-${color}-50 hover:bg-${color}-100 text-${color}-600 rounded-lg font-semibold text-sm transition-colors`, iconHtml.replace('18', '16') + text);
                button.onclick = onClick;
                return button;
            };

            gridActions.append(
                createMobileActionButton(ICONS.Eye, ' Items', () => showItems(bill.bill_number), 'blue'),
                createMobileActionButton(ICONS.CreditCard, ' Pay', () => openPaymentModal(bill), 'green'),
                createMobileActionButton(ICONS.History, ' History', () => showHistory(bill.bill_number), 'orange'),
                createMobileActionButton(ICONS.FileText, ' Bill', () => viewBill(bill.bill_number), 'slate'),
            );
            
            detailsDiv.append(gridDetails, gridActions);
            card.appendChild(detailsDiv);
        }
        
        wrapper.appendChild(card);
    });

    return wrapper;
};

// --- Modal Rendering ---

const renderItemsModal = () => {
    if (!state.itemsModal.open) return null;

    const modal = createElement('div', 'fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center modal-overlay p-4');
    modal.onclick = () => setState({ itemsModal: { open: false, items: [] } });

    const content = createElement('div', 'bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto modal-content');
    content.onclick = (e) => e.stopPropagation();

    const header = createElement('div', 'sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center rounded-t-2xl');
    header.innerHTML = '<h2 class="text-2xl font-bold text-slate-800">Items</h2>';
    const closeButton = createElement('button', 'p-2 hover:bg-slate-100 rounded-lg transition-colors', ICONS.X);
    closeButton.onclick = () => setState({ itemsModal: { open: false, items: [] } });
    header.appendChild(closeButton);
    
    const body = createElement('div', 'p-6');
    if (state.itemsModal.items.length > 0) {
        // Table content
        const tableWrapper = createElement('div', 'overflow-x-auto');
        const table = createElement('table', 'w-full');
        table.innerHTML = `
            <thead class="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">ID</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Item Name</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Quantity</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Amount/Gram</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                ${state.itemsModal.items.map((item, index) => `
                    <tr key="${index}" class="hover:bg-slate-50">
                        <td class="px-4 py-3 text-sm font-semibold text-slate-800">${item.sub_item_id}</td>
                        <td class="px-4 py-3 text-sm text-slate-700">${item.item_name}</td>
                        <td class="px-4 py-3 text-sm text-right text-slate-700">${item.quantity}gm</td>
                        <td class="px-4 py-3 text-sm text-right text-slate-700">${item.amount_per_gram}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        tableWrapper.appendChild(table);
        body.appendChild(tableWrapper);
    } else {
        body.innerHTML = '<p class="text-center text-slate-500 py-8">No items found</p>';
    }

    content.append(header, body);
    modal.appendChild(content);
    return modal;
};

const renderHistoryModal = () => {
    if (!state.historyModal.open) return null;

    const modal = createElement('div', 'fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center modal-overlay p-4');
    modal.onclick = () => setState({ historyModal: { open: false, history: [] } });

    const content = createElement('div', 'bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto modal-content');
    content.onclick = (e) => e.stopPropagation();

    const header = createElement('div', 'sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center rounded-t-2xl');
    header.innerHTML = '<h2 class="text-2xl font-bold text-slate-800">Payment History</h2>';
    const closeButton = createElement('button', 'p-2 hover:bg-slate-100 rounded-lg transition-colors', ICONS.X);
    closeButton.onclick = () => setState({ historyModal: { open: false, history: [] } });
    header.appendChild(closeButton);

    const body = createElement('div', 'p-6 space-y-4');
    
    if (state.historyModal.history.length > 0) {
        const totalPaid = state.historyModal.history.reduce((sum, subBill) => sum + parseFloat(subBill.amount_paid.toString()), 0);

        state.historyModal.history.forEach(subBill => {
            const paymentDate = new Date(subBill.payment_date).toLocaleDateString('en-GB');
            const paymentTime = new Date(subBill.payment_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            const historyItem = createElement('div', 'bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow');
            historyItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-lg font-bold text-blue-600 mb-1">Bill: ${subBill.sub_bill_number}</div>
                        <div class="text-sm text-slate-600">${paymentDate} | ${paymentTime}</div>
                    </div>
                    <div class="text-2xl font-bold text-green-600">
                        ₹${formatNumber(subBill.amount_paid)}
                    </div>
                </div>
            `;
            body.appendChild(historyItem);
        });

        const totalCard = createElement('div', 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-lg');
        totalCard.innerHTML = `
            <div class="text-right">
                <div class="text-sm opacity-90 mb-1">Total Paid</div>
                <div class="text-3xl font-bold">
                    ₹${formatNumber(totalPaid)}
                </div>
            </div>
        `;
        body.appendChild(totalCard);
    } else {
        body.innerHTML = '<p class="text-center text-slate-500 py-8">No payment history found</p>';
    }

    content.append(header, body);
    modal.appendChild(content);
    return modal;
};

const renderPaymentModal = () => {
    if (!state.paymentModal.open || !state.paymentModal.bill) return null;

    const { bill } = state.paymentModal;

    const modal = createElement('div', 'fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center modal-overlay p-4');
    modal.onclick = () => setState({ paymentModal: { open: false, bill: null } });

    const content = createElement('div', 'bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 modal-content');
    content.onclick = (e) => e.stopPropagation();
    
    content.innerHTML = `
        <h2 class="text-3xl font-bold text-slate-800 mb-6 text-center">Pay Balance</h2>
        <div class="space-y-4 mb-6">
            <div class="text-center">
                <span class="text-slate-600">Customer:</span>
                <span class="ml-2 text-xl font-bold text-slate-800">${bill.customer_name}</span>
            </div>
            <div class="text-center">
                <span class="text-slate-600">Bill Number:</span>
                <span class="ml-2 text-xl font-bold text-slate-800">${bill.bill_number}</span>
            </div>
            <div class="text-center">
                <span class="text-slate-600">Current Balance:</span>
                <span class="ml-2 text-2xl font-bold text-blue-600">₹${formatNumber(bill.balance_amount)}</span>
            </div>
        </div>
    `;

    const input = createElement('input', 'w-full px-5 py-4 border-2 border-slate-200 rounded-xl text-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none', '', {
        type: 'number',
        id: 'amountInput',
        placeholder: 'Enter amount to pay',
        max: bill.balance_amount,
        step: '0.01'
    });
    
    const buttonDiv = createElement('div', 'flex gap-3 flex-wrap justify-center');
    
    // --- FIX: Correctly access the input value and pass necessary data to confirmModal ---
    const confirmBtn = createElement('button', 'px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all', 'Confirm Payment');
    confirmBtn.onclick = () => {
        const amount = parseFloat(input.value);
        if (!isNaN(amount) && amount > 0 && amount <= bill.balance_amount) {
            // Pass bill details along with amount to confirmModal
            setState({ 
                paymentModal: { open: false, bill: null }, 
                confirmModal: { 
                    open: true, 
                    amount: amount, 
                    billNumber: bill.bill_number, 
                    customerName: bill.customer_name 
                } 
            });
        } else {
            input.classList.add('border-red-500');
            setTimeout(() => input.classList.remove('border-red-500'), 1500);
        }
    };
    
    const payFullBtn = createElement('button', 'px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all', 'Pay Full Balance');
    payFullBtn.onclick = () => {
        // Pass bill details along with full balance amount to confirmModal
        setState({ 
            paymentModal: { open: false, bill: null }, 
            confirmModal: { 
                open: true, 
                amount: bill.balance_amount, 
                billNumber: bill.bill_number, 
                customerName: bill.customer_name 
            } 
        });
    };
    
    const cancelBtn = createElement('button', 'px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all', 'Cancel');
    cancelBtn.onclick = () => setState({ paymentModal: { open: false, bill: null } });

    buttonDiv.append(confirmBtn, payFullBtn, cancelBtn);
    content.append(input, buttonDiv);
    modal.appendChild(content);
    return modal;
};

const renderConfirmModal = () => {
    if (!state.confirmModal.open) return null;

    const modal = createElement('div', 'fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center modal-overlay p-4');
    // NOTE: Clicks on overlay should only close if data is not needed anymore.
    // We keep this closed to prevent accidental data loss before confirmation.
    // modal.onclick = () => setState({ confirmModal: { open: false, amount: 0 } }); 

    const content = createElement('div', 'bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center modal-content');
    content.onclick = (e) => e.stopPropagation();
    
    const customerName = state.confirmModal.customerName || 'Customer';

    content.innerHTML = `
        <h2 class="text-2xl font-bold text-slate-800 mb-4">Confirm Payment</h2>
        <p class="text-lg text-slate-600 mb-2">
            Confirm payment for <span class="font-bold">${customerName}</span>.
        </p>
        <p class="text-lg text-slate-600 mb-8">
            Amount: <span class="font-bold text-blue-600">₹${formatNumber(state.confirmModal.amount)}</span>
        </p>
    `;

    const buttonDiv = createElement('div', 'flex gap-4 justify-center');
    
    const yesBtn = createElement('button', 'px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all', 'Yes, Pay');
    yesBtn.onclick = confirmPayment;
    
    const cancelBtn = createElement('button', 'px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all', 'Cancel');
    cancelBtn.onclick = () => setState({ confirmModal: { open: false, amount: 0, billNumber: null, customerName: '' } });

    buttonDiv.append(yesBtn, cancelBtn);
    content.appendChild(buttonDiv);
    modal.appendChild(content);
    return modal;
};

const renderSuccessModal = () => {
    if (!state.successModal.open) return null;

    const { amount, customerName } = state.successModal;

    const modal = createElement('div', 'fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center modal-overlay p-4');
    
    const content = createElement('div', 'bg-white rounded-2xl shadow-2xl max-w-md w-full p-12 text-center modal-content');
    
    content.innerHTML = `
        <div class="text-8xl mb-6">✅</div>
        <h2 class="text-3xl font-bold text-green-600 mb-4">Payment Successful</h2>
        <p class="text-lg text-slate-600 mb-8">
            ₹${formatNumber(amount)} has been paid for <span class="font-bold">${customerName}</span> successfully!
        </p>
    `;
    
    const doneBtn = createElement('button', 'px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all', 'Done');
    doneBtn.onclick = () => {
        setState({ successModal: { open: false, amount: 0, customerName: '' } });
        fetchBills();
    };

    content.appendChild(doneBtn);
    modal.appendChild(content);
    return modal;
};

// --- Main Render Function ---

const renderApp = () => {
    // 1. Clear and re-render main application content
    appRoot.innerHTML = '';
    
    const header = renderHeader();
    const mainContent = renderMainContent();
    
    appRoot.append(header, mainContent);

    // 2. Clear and re-render modals
    modalContainer.innerHTML = '';
    
    const modals = [
        renderItemsModal(),
        renderHistoryModal(),
        renderPaymentModal(),
        renderConfirmModal(),
        renderSuccessModal(),
    ];
    
    modals.forEach(modal => {
        if (modal) modalContainer.appendChild(modal);
    });
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchBills();
});