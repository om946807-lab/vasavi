// ------------------- Utility Functions -------------------
function formatNumber(num) {
  return new Intl.NumberFormat("en-IN").format(num);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// ------------------- DOM Ready -------------------
document.addEventListener("DOMContentLoaded", () => {
  const welcomeMessage = document.querySelector(".welcome-message");
  const navLinks = document.querySelector(".nav-container");

  // Show welcome message temporarily
  if (welcomeMessage) {
    welcomeMessage.style.opacity = "1";
    setTimeout(() => {
      welcomeMessage.style.opacity = "0";
      setTimeout(() => {
        welcomeMessage.style.display = "none";
        if (navLinks) {
          navLinks.style.display = "flex";
          navLinks.style.opacity = "1";
        }
      }, 500);
    }, 4000);
  }

  // Fetch all data for dashboard
  fetchGoldDetails();
  fetchSilverDetails();
  fetchBillDetails();
  fetchOrderDetails();
  // fetchBalanceDetails();
  // fetchOldBalanceDepositeDetails();
});

// ------------------- Fetch Gold Details -------------------
async function fetchGoldDetails() {
  try {
    const res = await fetch("/api/gold-details");
    const data = await res.json();

    document.getElementById("gold-total-weight").textContent =
      (data.total_weight || 0) + " gm";
    document.getElementById("gold-total-items").textContent =
      data.total_items || 0;

  } catch (err) {
    console.error("Error fetching gold details:", err);
  }
}

// ------------------- Fetch Silver Details -------------------
async function fetchSilverDetails() {
  try {
    const res = await fetch("/api/silver-details");
    const data = await res.json();
    
    document.getElementById("silver-total-weight").textContent =
    (data.total_weight || 0) + " gm";
    document.getElementById("silver-total-items").textContent =
    data.total_items || 0;
    
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("silver-orders-on-date").textContent =
    (data.sold_today || 0) + " gm (" + (data.count_today || 0) + ")";
  } catch (err) {
    console.error("Error fetching silver details:", err);
  }
}

// ------------------- Fetch Sale/Bill Details -------------------
async function fetchBillDetails() {
  try {
    const res = await fetch("/api/sale-details");
    const data = await res.json();
    
    document.getElementById("total_amount").textContent =
    "₹" + formatNumber(Math.floor(data.total_amount || 0));
    document.getElementById("discount").textContent =
    "₹" + formatNumber(Math.floor(data.discount || 0));
    document.getElementById("oldGold").textContent =
      "₹" + formatNumber(Math.floor(data.oldGold || 0));
      document.getElementById("amount_paid").textContent =
      "₹" + formatNumber(Math.floor(data.amount_paid || 0));
    document.getElementById("balance").textContent =
    "₹" + formatNumber(Math.floor(data.balance || 0));
  } catch (err) {
    console.error("Error fetching sale details:", err);
  }
}

// ------------------- Fetch Orders -------------------
async function fetchOrderDetails() {
  try {
    const res = await fetch("/api/order-details");
    const data = await res.json();
    
    document.getElementById("total-orders").textContent =
    formatNumber(data.total_orders || 0);
    document.getElementById("gold-orders-on-date").textContent =
    (data.gold_orders_today || 0) + " gm (" + (data.gold_orders_today_count || 0) + ")";
    document.getElementById("silver-orders-on-date").textContent =
    (data.silver_orders_today || 0) + " gm (" + (data.silver_orders_today_count || 0) + ")";
    document.getElementById("amount-collected-on-date").textContent ="₹ " + formatNumber(data.amount_collected_today || 0)
  } catch (err) {
    console.error("Error fetching order details:", err);
  }
}

// // ------------------- Fetch Balance Details -------------------
// async function fetchBalanceDetails() {
//   try {
//     const res = await fetch("/api/balance-details");
//     const data = await res.json();

//     document.getElementById("total-balance").textContent =
//       "₹" + formatNumber(data.total_balance || 0);
//     document.getElementById("total-count").textContent =
//       formatNumber(data.total_count || 0);
//   } catch (err) {
//     console.error("Error fetching balance details:", err);
//   }
// }

// // ------------------- Fetch Old Balance / Deposits -------------------
// async function fetchOldBalanceDepositeDetails() {
//   try {
//     const res = await fetch("/api/old-balance-deposite-details");
//     const data = await res.json();

//     document.getElementById("total-deposit").textContent =
//       "₹" + formatNumber(data.total_deposit || 0);
//     document.getElementById("total-old-balance").textContent =
//       "₹" + formatNumber(data.total_old_balance || 0);
//     document.getElementById("total-count-balance").textContent =
//       formatNumber(data.total_count || 0);
//   } catch (err) {
//     console.error("Error fetching old balance details:", err);
//   }
// }
