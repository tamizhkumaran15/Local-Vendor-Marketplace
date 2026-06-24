import { auth } from "./firebase.js";
import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Chart elements
const pieCtx = document.getElementById("adminPie");
const barCtx = document.getElementById("adminBar");

// Stat elements
const statOrders = document.getElementById("statOrders");
const statRevenue = document.getElementById("statRevenue");
const statDiscount = document.getElementById("statDiscount");
const statUsers = document.getElementById("statUsers");

async function loadAdminDashboard() {

  // 🔥 LOAD ALL ORDERS (NO FILTER)
  const snapshot = await getDocs(collection(db, "orders"));

  if (snapshot.empty) {
    alert("No orders found");
    return;
  }

  let totalOrders = 0;
  let totalRevenue = 0;
  let totalDiscount = 0;

  const usersSet = new Set();
  const barLabels = [];
  const barValues = [];

  snapshot.forEach(doc => {
    const o = doc.data();

    totalOrders++;
    totalRevenue += o.total;
    totalDiscount += o.discount;
    usersSet.add(o.userId);

    if (o.createdAt) {
      const d = o.createdAt.toDate();
      barLabels.push(d.toLocaleDateString());
      barValues.push(o.total - o.discount);
    }
  });

  // 🧮 UPDATE STATS
  statOrders.textContent = totalOrders;
  statRevenue.textContent = totalRevenue;
  statDiscount.textContent = totalDiscount;
  statUsers.textContent = usersSet.size;

  // 🥧 PIE CHART
  new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Revenue", "Discount"],
      datasets: [{
        data: [totalRevenue, totalDiscount],
        backgroundColor: ["#2563eb", "#f59e0b"]
      }]
    }
  });

  // 📊 BAR CHART
  new Chart(barCtx, {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [{
        label: "Payable Amount",
        data: barValues,
        backgroundColor: "#16a34a"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
// =======================
// ADD PRODUCT
// =======================
const addBtn = document.getElementById("addProductBtn");

if (addBtn) {
  addBtn.addEventListener("click", async () => {

    const name = document.getElementById("pName").value.trim();
    const price = document.getElementById("pPrice").value;
    const discount = document.getElementById("pDiscount").value;
    const image = document.getElementById("pImage").value.trim();

    if (!name || !price || !image) {
      alert("Fill required fields");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        discount: Number(discount) || 0,
        image,
        rating: 5
      });

      alert("✅ Product Added!");
      loadProductsTable();

      document.getElementById("pName").value = "";
      document.getElementById("pPrice").value = "";
      document.getElementById("pDiscount").value = "";
      document.getElementById("pImage").value = "";

    } catch (err) {
      console.error(err);
      alert("❌ Failed to add product");
    }
  });
}
// =======================
// LOAD PRODUCTS TABLE
// =======================
async function loadProductsTable() {

  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  const snap = await getDocs(collection(db, "products"));

  tbody.innerHTML = "";

  snap.forEach(p => {
    const d = p.data();

    tbody.innerHTML += `
      <tr>
        <td><img src="${d.image}" width="40"></td>
        <td>${d.name}</td>
        <td>₹${d.price}</td>
        <td>₹${d.discount || 0}</td>
        <td>
          <button onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}
// =======================
// DELETE PRODUCT
// =======================
window.deleteProduct = async function(id) {

  if (!confirm("Delete this product?")) return;

  await deleteDoc(doc(db, "products", id));
  loadProductsTable();
}

// 🔐 AUTH CHECK (ADMIN MUST BE LOGGED IN)
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadAdminDashboard();
  loadProductsTable(); // 👈 ADD THIS LINE
});

