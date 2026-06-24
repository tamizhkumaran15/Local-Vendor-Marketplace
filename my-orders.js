import { auth } from "./firebase.js";
import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// 🔹 DOM ELEMENTS
const ordersList = document.getElementById("ordersList");
const dateFilter = document.getElementById("dateFilter"); // ✅ DATE FILTER

// 🔹 LOAD ORDERS
async function loadMyOrders(userId) {
  // Skeleton loader
  ordersList.innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  `;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    ordersList.innerHTML = "<p>No orders found.</p>";
    return;
  }

  ordersList.innerHTML = "";

  const selectedDate = dateFilter?.value; // ✅ GET SELECTED DATE

  snapshot.forEach(docSnap => {
    const order = docSnap.data();

    // ✅ DATE FILTER LOGIC
    if (selectedDate && order.createdAt) {
      const orderDate = order.createdAt
        .toDate()
        .toISOString()
        .split("T")[0];

      if (orderDate !== selectedDate) return;
    }

    let itemsHtml = "";
    let subTotal = 0;

    order.items.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      subTotal += itemTotal;

      itemsHtml += `
        <li>
          ${index + 1}) ${item.name} × ${item.quantity}
          = ₹${item.price} × ${item.quantity}
          = <b>₹${itemTotal}</b>
        </li>
      `;
    });

    const payable = subTotal - order.discount;

    ordersList.innerHTML += `
      <div style="border:1px solid #ccc; padding:15px; margin-bottom:20px;">
        
        <p><b>Order ID:</b> ${docSnap.id}</p>

        <p><b>Items:</b></p>
        <ul>${itemsHtml}</ul>

        <p><b>Subtotal:</b> ₹${subTotal}</p>
        <p><b>Discount:</b> ₹${order.discount}</p>
        <p><b>Payable:</b> <b>₹${payable}</b></p>

        <p>
          <b>Status:</b>
          <span class="status ${order.status}">
            ${order.status.toUpperCase()}
          </span>
        </p>

        <p><b>Date:</b> ${
          order.createdAt
            ? order.createdAt.toDate().toLocaleString()
            : "N/A"
        }</p>

        <button onclick="cancelOrder('${docSnap.id}')">
          ❌ Cancel Order
        </button>

        <button onclick="deleteOrder('${docSnap.id}')">
          🗑️ Delete Order
        </button>

        <button onclick="printInvoice(event)">
          🧾 Invoice
        </button>

      </div>
    `;
  });

  // If date filter applied but no matching orders
  if (ordersList.innerHTML.trim() === "") {
    ordersList.innerHTML = "<p>No orders found for selected date.</p>";
  }
}

// 🔴 DELETE ORDER
window.deleteOrder = async function (orderId) {
  if (!confirm("Are you sure you want to delete this order?")) return;

  await deleteDoc(doc(db, "orders", orderId));
  alert("Order deleted successfully");
  loadMyOrders(auth.currentUser.uid);
};

// 🔴 CANCEL ORDER (STATUS UPDATE)
window.cancelOrder = async function (orderId) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "cancelled"
  });
  alert("Order cancelled");
  loadMyOrders(auth.currentUser.uid);
};

// 🔴 INVOICE (PRINT / PDF)
window.printInvoice = function (event) {
  const orderDiv = event.target.closest("div");
  const invoiceWindow = window.open("", "", "width=800,height=600");

  invoiceWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: Arial; padding:20px; }
          h2 { text-align:center; }
          ul { padding-left:20px; }
        </style>
      </head>
      <body>
        <h2>Invoice</h2>
        ${orderDiv.innerHTML}
      </body>
    </html>
  `);

  invoiceWindow.document.close();
  invoiceWindow.print();
};

// 🔹 DATE FILTER CHANGE EVENT
if (dateFilter) {
  dateFilter.addEventListener("change", () => {
    loadMyOrders(auth.currentUser.uid);
  });
}

// 🔐 AUTH CHECK
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  loadMyOrders(user.uid);
});
