function formatNumber(num) {
  return new Intl.NumberFormat("en-IN").format(num);
}
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
document.addEventListener("DOMContentLoaded", () => {
  const welcomeMessage = document.querySelector(".welcome-message");
  const navLinks = document.querySelector(".nav-container");

  // Show the welcome message and hide it after 4 seconds
  setTimeout(() => {
    welcomeMessage.style.opacity = "1";
    setTimeout(() => {
      welcomeMessage.style.opacity = "0";
      setTimeout(() => {
        welcomeMessage.style.display = "none";
        navLinks.style.display = "flex";
        navLinks.style.opacity = "1";
      }, 500); // Delay before showing nav links
    }, 4000); // Hide the message after 4 seconds
  }, 0); // Show immediately on page load
});
window.onload = function () {
  setTimeout(function () {
    const tables = document.querySelectorAll(".data-table");
    tables.forEach((table) => {
      table.classList.add("show"); // Add the 'show' class after 4 seconds
    });
  }, 4000); // 4 seconds delay
};
async function fetchGoldDetails() {
  try {
    const response = await fetch("/api/gold-details");
    const data = await response.json();

    // Update total weight and total items
    document.getElementById("gold-total-weight").textContent =
      (data.total_weight || 0) + "gm";
    document.getElementById("gold-total-items").textContent =
      data.total_items || 0;

    // Handle sold gold data
    const soldData = data.sold_gold;
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Set the date in the header
    document.getElementById(
      "sold-gold-header"
    ).textContent = ` Today's Summary(${formatDate(today)})`;

    // Clear previous data in the table
    const goldSoldDataBody = document.getElementById("gold-sold-data");
    goldSoldDataBody.innerHTML = ""; // Clear existing rows

    if (soldData.length === 0) {
      // If no data, display zero values
      const row = goldSoldDataBody.insertRow();
      row.innerHTML = `<td>${formatDate(today)}</td>
                        <td>0gm</td>
                        <td>₹0</td>`;
    } else {
      // Populate sold gold data
      soldData.forEach((item) => {
        const row = goldSoldDataBody.insertRow();
        row.innerHTML = `<td>${formatDate(item.date)}</td>
                            <td>${item.items_sold || 0}gm</td>
                            <td>₹${
                              formatNumber(item.amount_collected) || 0
                            }</td>`;
      });
    }
  } catch (error) {
    console.error("Error fetching gold details:", error);
  }
}

async function fetchSilverDetails() {
  try {
    const response = await fetch("/api/silver-details");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    // Update total weight and total items
    document.getElementById("silver-total-weight").textContent =
      (data.total_weight || 0) + "gm";
    document.getElementById("silver-total-items").textContent =
      data.total_items || 0;

    // Handle sold silver data
    const soldData = data.sold_silver;
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Set the date in the header
    document.getElementById(
      "sold-silver-header"
    ).textContent = `Today's Summary(${formatDate(today)})`;

    // Clear previous data in the table
    const silverSoldDataBody = document.getElementById("silver-sold-data");
    silverSoldDataBody.innerHTML = ""; // Clear existing rows

    // Check if soldData is empty or undefined
    if (!soldData || soldData.length === 0) {
      const row = silverSoldDataBody.insertRow();
      row.insertCell(0).textContent = formatDate(today);
      row.insertCell(1).textContent = "0gm";
      row.insertCell(2).textContent = "₹0";
    } else {
      // Populate sold silver data
      soldData.forEach((item) => {
        const row = silverSoldDataBody.insertRow();
        row.insertCell(0).textContent = formatDate(item.date);
        row.insertCell(1).textContent = `${item.items_sold || 0}gm`;
        row.insertCell(2).textContent = `₹${
          formatNumber(item.amount_collected) || 0
        }`;
      });
    }
  } catch (error) {
    console.error("Error fetching silver details:", error);
  }
}

async function fetchBillDetails() {
  try {
    const response = await fetch("/api/sale-details");
    const data = await response.json();

    // Update total weight and total items
    document.getElementById("total_amount").textContent =
      "₹" + formatNumber(Math.floor(data.total_amount || 0));
    document.getElementById("discount").textContent =
      "₹" + formatNumber(Math.floor(data.discount || 0));
    document.getElementById("amount_paid").textContent =
      "₹" + formatNumber(Math.floor(data.amount_paid || 0));
    document.getElementById("balance").textContent =
      "₹" + formatNumber(Math.floor(data.balance || 0));
    document.getElementById("oldGold").textContent =
      "₹" + formatNumber(Math.floor(data.oldGold || 0)); // Assuming total_bills is a count, no ₹ needed.

    const soldData = data.sold_items;
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    document.getElementById(
      "sold-date"
    ).textContent = ` Today's Summary(${formatDate(today)})`;

    // Clear previous data in the table
    const saleOnTableBody = document.getElementById("sale-on-data");
    saleOnTableBody.innerHTML = ""; // Clear existing rows

    // Check if soldData is empty or undefined
    if (!soldData || soldData.length === 0) {
      const row = saleOnTableBody.insertRow();
      row.innerHTML = `
                        <td>${formatDate(today)}</td>
                        <td>0</td>
                        <td>₹0</td>
                        <td>₹0</td>
                        <td>₹0</td>`;
    } else {
      // Populate sale data with required columns
      soldData.forEach((item) => {
        const row = saleOnTableBody.insertRow();
        row.innerHTML = `
                            <td>₹${
                              formatNumber(item.amount_collected) || 0
                            }</td>
                            <td>₹${formatNumber(item.amount_paid) || 0}</td>
                            <td>₹${formatNumber(item.oldGold) || 0}</td>
                            <td>₹${formatNumber(item.discount) || 0}</td>
                            <td>₹${formatNumber(item.balance) || 0}</td>`;
      });
    }
  } catch (error) {
    console.error("Error fetching sale details:", error);
  }
}
async function fetchOrderDetails() {
  try {
    const response = await fetch("/api/order-details");
    const data = await response.json();
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    document.getElementById(
      "sold-date1"
    ).textContent = ` Today's Summary(${formatDate(today)})`;

    // Ensure we handle cases where data might be null or undefined
    const goldTotal = data.gold_total || 0;
    const silverTotal = data.silver_total || 0;
    const goldTotalCount = data.gold_count_total || 0;
    const silverTotalCount = data.silver_count_total || 0;
    const totalOrders = data.total_orders || 0;
    const goldOrdersToday = data.gold_orders_today || 0;
    const silverOrdersToday = data.silver_orders_today || 0;
    const goldOrdersTodayCount = data.gold_orders_today_count || 0;
    const silverOrdersTodayCount = data.silver_orders_today_count || 0;
    const amountCollectedToday = data.amount_collected_today || 0;

    // Update the HTML elements with the fetched data
    document.getElementById("gold-total").textContent =
      formatNumber(goldTotal) + "gm" + ` (${goldTotalCount})`; // Include count in brackets
    document.getElementById("silver-total").textContent =
      formatNumber(silverTotal) + "gm" + ` (${silverTotalCount})`; // Include count in brackets
    document.getElementById("total-orders").textContent =
      formatNumber(totalOrders);
    document.getElementById("gold-orders-on-date").textContent =
      formatNumber(goldOrdersToday) + "gm" + ` (${goldOrdersTodayCount})`; // Include count in brackets
    document.getElementById("silver-orders-on-date").textContent =
      formatNumber(silverOrdersToday) + "gm" + ` (${silverOrdersTodayCount})`; // Include count in brackets
    document.getElementById("amount-collected-on-date").textContent =
      "₹" + formatNumber(amountCollectedToday);
  } catch (error) {
    console.error("Error fetching order details:", error);
  }
}
async function fetchBalanceDetails() {
  try {
    const response = await fetch("/api/balance-details");
    const data = await response.json();
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    document.getElementById(
      "sold-date2"
    ).textContent = `Balance Details (${formatDate(today)})`;

    // Extract values from the response
    const totalBalance = data.total_balance || 0;
    const totalCount = data.total_count || 0;
    const amountPaidToday = data.amount_paid_today || 0;
    const customerCountToday = data.customer_count_today || 0;

    // Update the HTML elements with the fetched data
    document.getElementById("total-balance").textContent =
      "₹" + formatNumber(totalBalance);
    document.getElementById("total-count").textContent =
      formatNumber(totalCount);

    // Update today's balance paid data
    const diamondSoldDataRow = document.getElementById("diamond-sold-data");
    diamondSoldDataRow.innerHTML = `<tr>
                    <td>${formatDate(today)}</td>
                    <td>₹${formatNumber(amountPaidToday)}</td>
                    <td>${formatNumber(customerCountToday)}</td>
                </tr>`;
  } catch (error) {
    console.error("Error fetching balance details:", error);
  }
}
async function fetchOldBalanceDepositeDetails() {
  try {
    const response = await fetch("/api/old-balance-deposite-details");
    const data = await response.json();

    // Format the current date for display
    const today = new Date().toISOString().split("T")[0];

    // Update the HTML elements with the fetched data
    document.getElementById("total-deposit").textContent =
      "₹" + formatNumber(data.total_deposit);
    document.getElementById("total-old-balance").textContent =
      "₹" + formatNumber(data.total_old_balance);
    document.getElementById("total-count-balance").textContent = formatNumber(
      data.total_count
    );

    // Update date-specific data
    document.getElementById(
      "sold-date3"
    ).textContent = `Deposits and balance's on Date (${formatDate(today)})`;
    const tableBody = document.getElementById("old-balance-data");
    tableBody.innerHTML = `
                    <tr>
                        <td>${formatDate(today)}</td>
                        <td>₹${formatNumber(data.amount_paid_today)}</td>
                        <td>₹${formatNumber(data.deposit_today)}</td>
                    </tr>
                `;
  } catch (error) {
    console.error("Error fetching old balance and deposit details:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchGoldDetails();
  fetchSilverDetails();
  fetchBillDetails();
  fetchOrderDetails();
  fetchBalanceDetails();
  fetchOldBalanceDepositeDetails();
});
