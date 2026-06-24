import { auth } from "./firebase.js";
import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

let pieChart = null;
let barChart = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  await loadDashboard(user.uid);
});

async function loadDashboard(userId) {

  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.warn("No orders found");
    return;
  }

  let totalOrders = snapshot.size;
  let totalAmount = 0;
  let totalDiscount = 0;
  let totalPayable = 0;
  let totalItems = 0;

  const barLabels = [];
  const barValues = [];
  const barMeta = [];

  snapshot.forEach(docSnap => {
    const o = docSnap.data();
    if (!o.createdAt) return;

    totalAmount += o.total;
    totalDiscount += o.discount;
    totalPayable += (o.total - o.discount);
    totalItems += o.items.length;

    const d = o.createdAt.toDate();
    const label = d.toLocaleDateString();

    barLabels.push(label);
    barValues.push(o.total - o.discount);

    barMeta.push({
      items: o.items.length,
      total: o.total,
      discount: o.discount,
      payable: o.total - o.discount,
      status: o.status
    });
  });

  // UPDATE STATS
  document.getElementById("statOrders").textContent = totalOrders;
  document.getElementById("statPayable").textContent = totalPayable;
  document.getElementById("statDiscount").textContent = totalDiscount;
  document.getElementById("statItems").textContent = totalItems;

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  // PIE
  pieChart = new Chart(document.getElementById("summaryPie"), {
    type: "doughnut",
    data: {
      labels: ["Total Ordered", "Discount", "Payable"],
      datasets: [{
        data: [totalAmount, totalDiscount, totalPayable],
        backgroundColor: ["#2563eb", "#f59e0b", "#16a34a"]
      }]
    }
  });

  // BAR
  barChart = new Chart(document.getElementById("ordersBar"), {
    type: "bar",
    data: {
      labels: barLabels,
      datasets: [{
        label: "Payable",
        data: barValues,
        backgroundColor: "#2563eb"
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: ctx => {
              const m = barMeta[ctx[0].dataIndex];
              return [
                `Items: ${m.items}`,
                `Total: ₹${m.total}`,
                `Discount: ₹${m.discount}`,
                `Payable: ₹${m.payable}`,
                `Status: ${m.status}`
              ];
            }
          }
        }
      }
    }
  });
}
