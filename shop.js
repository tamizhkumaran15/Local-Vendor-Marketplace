import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const productList = document.getElementById("productList");
const shopSearch = document.getElementById("shopSearch");

const vendorId = new URLSearchParams(window.location.search).get("vendorId");
console.log("SHOP vendorId =", vendorId);
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadProducts("");
});

async function loadProducts(keyword = "") {

  let snap;

  if (vendorId) {
    const q = query(
      collection(db, "products"),
      where("vendorId", "==", vendorId)
    );
    snap = await getDocs(q);
  } else {
    snap = await getDocs(collection(db, "products"));
  }

  productList.innerHTML = "";
  let found = false;

  snap.forEach(docSnap => {
    const p = docSnap.data();

    if (p.name.toLowerCase().includes(keyword)) {

      found = true;

      productList.innerHTML += `
        <div class="product">
          <div class="card-img">
            <img src="${p.image}">
          </div>
          <h3>${p.name}</h3>
          <p>₹${p.price}</p>
          <button onclick="addToCartShop(
            '${docSnap.id}',
            '${p.name}',
            ${p.price},
            '${p.image}'
          )">
            Add to Cart
          </button>
        </div>
      `;
    }
  });

  if (!found) {
    productList.innerHTML = "<p>No products found</p>";
  }

  // 🔥 VERY IMPORTANT
  setTimeout(predictHighDemandProducts, 500);

}

shopSearch.addEventListener("input", (e) => {
  loadProducts(e.target.value.toLowerCase());
});
// =========================
// GLOBAL CART SYSTEM (FIXED)
// =========================

window.addToCartShop = function(id, name, price, image) {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  price = Number(price) || 0;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + 1;
  } else {
    cart.push({
      id,
      name,
      price,
      image,
      quantity: 1,   // ✅ FIXED (was qty)
      discount: 0
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  // ✅ update landing page cart if available
  if (typeof updateCart === "function") {
    updateCart();
  }

  updateCartUI(); // keep your header update

  alert("✅ Added to cart");
};

function updateCartUI() {

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  let count = 0;
  let total = 0;

 cart.forEach(i => {
  const qty = Number(i.quantity) || 0;
  const price = Number(i.price) || 0;

  count += qty;
  total += price * qty;
});

  // Update header if exists
  const countEl = document.getElementById("cart-count");
  const totalEl = document.getElementById("cart-total");

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = `₹${total}`;
}

// run once on load
updateCartUI();
async function predictHighDemandProducts() {

  const ordersSnap = await getDocs(collection(db, "orders"));

  const demandMap = {};

  ordersSnap.forEach(docSnap => {

    const order = docSnap.data();

    order.items?.forEach(item => {

      const name = item.name?.toLowerCase().trim();
      const qty = Number(item.quantity ?? item.qty ?? 1);

      if (!demandMap[name]) demandMap[name] = 0;

      demandMap[name] += qty;

    });

  });

  const demandArray = Object.entries(demandMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a,b)=>b.qty-a.qty);

  console.log("📊 Demand Prediction:", demandArray);

  highlightHighDemand(demandArray);

}
function highlightHighDemand(topProducts) {

  const cards = document.querySelectorAll(".product");

  cards.forEach(card => {

    const name = card.querySelector("h3")?.textContent
      ?.toLowerCase()
      .trim();

    const isHighDemand = topProducts.find(
      p => p.name === name
    );

    if (isHighDemand && !card.querySelector(".high-demand-badge")) {

      card.style.border = "3px solid #ff9800";

      card.insertAdjacentHTML(
        "afterbegin",
        `<div class="high-demand-badge" style="
          background:#ff9800;
          color:white;
          padding:4px;
          text-align:center;
          font-weight:bold;
          border-radius:6px;
          margin-bottom:6px;
        ">🔥 High Demand</div>`
      );

    }

  });

}