// Utility Functions
function formatToIndianCurrency(number) {
    const x = number.toString().split(".");
    let integerPart = x[0];
    const decimalPart = x.length > 1 ? "." + x[1] : "";
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);

    if (otherNumbers !== '') {
        integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    } else {
        integerPart = lastThree;
    }

    return integerPart + decimalPart;
}

function convertNumberToWords(amount) {
    const ones = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    function convertChunk(number) {
        let words = '';
        const hundred = Math.floor(number / 100);
        number %= 100;
        const ten = Math.floor(number / 10);
        const one = number % 10;

        if (hundred) {
            words += ones[hundred] + ' Hundred ';
        }
        if (ten > 1) {
            words += tens[ten] + ' ';
            if (one) {
                words += ones[one] + ' ';
            }
        } else if (ten === 1) {
            words += ones[number] + ' ';
        } else if (one) {
            words += ones[one] + ' ';
        }
        return words.trim();
    }

    if (amount === 0) return 'Zero';

    let words = '';
    let scaleIndex = 0;

    while (amount > 0) {
        let chunk;
        if (scaleIndex === 0) {
            chunk = amount % 1000;
        } else {
            chunk = amount % 100;
        }

        if (chunk > 0) {
            words = convertChunk(chunk) + ' ' + scales[scaleIndex] + ' ' + words;
        }
        amount = Math.floor(amount / (scaleIndex === 0 ? 1000 : 100));
        scaleIndex++;
    }

    return words.trim() + ' Only';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Print Function
function printBill() {
    window.print();
}

// Share PDF Function
async function shareBill() {
    const button = event.target.closest('button');
    const originalText = button.innerHTML;

    // Show loading state
    button.disabled = true;
    button.innerHTML = button.classList.contains('mobile-btn')
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>Loading...'
        : 'Generating PDF...';

    try {
        const element = document.getElementById('bill-content');
        const billNumber = document.getElementById('billNumber').textContent.trim();

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Bill_${billNumber || 'Invoice'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };

        // Generate PDF
        const pdf = await html2pdf().set(opt).from(element).toPdf().get('pdf');
        const pdfBlob = pdf.output('blob');

        // Check if Web Share API is available
        if (navigator.share && navigator.canShare) {
            const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: `Bill ${billNumber}`,
                        text: 'Sri Vasavi Jewellers - Bill',
                        files: [file]
                    });
                    console.log('PDF shared successfully');
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.log('Share cancelled or failed, downloading instead');
                        downloadPDF(pdfBlob, opt.filename);
                    }
                }
            } else {
                // Fallback to download if file sharing not supported
                downloadPDF(pdfBlob, opt.filename);
            }
        } else {
            // Fallback to download if Web Share API not available
            downloadPDF(pdfBlob, opt.filename);
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    } finally {
        // Restore button state
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Load Bill Data
document.addEventListener('DOMContentLoaded', async () => {
    const billNumber = new URLSearchParams(window.location.search).get('billNumber');

    if (!billNumber) {
        console.error('No bill number found in the URL');
        alert('No bill number specified');
        return;
    }

    try {
        // Fetch bill details
        const billResponse = await fetch(`/fetch-bill-details/${billNumber}`);
        if (!billResponse.ok) {
            throw new Error('Failed to fetch bill details');
        }

        const billDetails = await billResponse.json();
        console.log('Fetched Bill Details:', billDetails);

        // Populate bill details
        document.getElementById('billNumber').textContent = billDetails.billNumber;
        document.getElementById('customerName').textContent = billDetails.customerName;
        document.getElementById('customerPhone').textContent = billDetails.customerPhone;
        document.getElementById('billDate').textContent = formatDate(billDetails.billDate);

        // Fetch bill items
        const itemsResponse = await fetch(`/fetch-bill-items/${billNumber}`);
        if (!itemsResponse.ok) {
            throw new Error('Failed to fetch bill items');
        }

        const items = await itemsResponse.json();
        console.log('Fetched Bill Items:', items);

        const billSummary = document.getElementById('billSummary').getElementsByTagName('tbody')[0];
        billSummary.innerHTML = '';

        if (items.length > 0) {
            items.forEach(item => {
                const newRow = billSummary.insertRow();
                newRow.innerHTML = `
                    <td>${item.itemName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.stoneWeight === 0 || item.stoneWeight === null ? '-' : item.stoneWeight}</td>
                    <td>${formatToIndianCurrency(item.amountPerGram)}</td>
                    <td>${item.wastage === 0 || item.wastage === null ? '-' : item.wastage + '%'}</td>
                    <td>${formatToIndianCurrency(item.makingCharges)}</td>
                    <td>${formatToIndianCurrency(item.totalAmount)}</td>
                `;
            });
        } else {
            const newRow = billSummary.insertRow();
            const cell = newRow.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'No items found';
            cell.style.textAlign = 'center';
        }

        // Populate totals
        document.getElementById('subtotal').textContent = `₹${formatToIndianCurrency(parseFloat(billDetails.subtotal.toFixed(2)))}`;
        document.getElementById('discount').textContent = `₹${formatToIndianCurrency(parseFloat(billDetails.discount.toFixed(2)))}`;
        document.getElementById('oldGold').textContent = `₹${formatToIndianCurrency(parseFloat(billDetails.oldGold.toFixed(2)))}`;
        document.getElementById('amountPaid').textContent = `₹${formatToIndianCurrency(parseFloat(billDetails.amountPaid.toFixed(2)))}`;

        // Show old balance row if greater than 0
        if (billDetails.oldBalance > 0) {
            document.getElementById('oldBalanceRow').style.display = 'flex';
            document.getElementById('oldBalance').textContent = `₹${formatToIndianCurrency(billDetails.oldBalance)}`;
        }

        document.getElementById('balanceAmount').textContent = `₹${formatToIndianCurrency(parseFloat(billDetails.balanceAmount.toFixed(2)))}`;
        document.getElementById('amountInWords').textContent = convertNumberToWords(Math.floor(billDetails.subtotal - billDetails.discount));

        // Fetch sub-bills (payment details)
        const subBillsResponse = await fetch(`/fetch-sub-bills/${billNumber}`);
        if (subBillsResponse.ok) {
            const subBills = await subBillsResponse.json();
            console.log('Fetched Sub-Bills:', subBills);

            if (subBills.length > 1) {
                const paymentTableBody = document.getElementById('paymentTable').getElementsByTagName('tbody')[0];
                paymentTableBody.innerHTML = '';

                subBills.forEach(subBill => {
                    const newRow = paymentTableBody.insertRow();
                    newRow.innerHTML = `
                        <td>${subBill.details}</td>
                        <td>₹${formatToIndianCurrency(subBill.amountPaid)}</td>
                        <td>${formatDate(subBill.paymentDate)}</td>
                    `;
                });

                document.getElementById('paymentDetailsContainer').style.display = 'flex';
            }
        }

    } catch (error) {
        console.error('Error fetching bill data:', error);
        alert('Error loading bill details. Please try again.');
    }
});
