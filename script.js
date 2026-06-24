// script.js (Firestore + Cart Safe Version)

// 🔹 IMPORTS (TOP LEVEL ONLY)
import { auth } from "./firebase.js";
import { db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// 🔹 DOM READY
document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // 🔹 BASIC ELEMENTS
  // ===============================
  const productList = document.getElementById("productList");
  const cartCount = document.getElementById("cart-count");
  const cartBtn = document.getElementById("cart-btn");
  const cartPopup = document.getElementById("cart-popup");
  const cartItemsDiv = document.getElementById("cart-items");
  const discountTotalSpan = document.getElementById("discount-total");
  const payableTotalSpan = document.getElementById("payable-total");
  const cartTotal = document.getElementById("cart-total");
  const logoutBtn = document.getElementById("logoutBtn");
  // ===============================
  // 👤 PROFILE DROPDOWN ELEMENTS
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileEmail = document.getElementById("profileEmail");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  // ✅ LOAD CART ON PAGE OPEN
updateCart();
  // 🌍 Store user coordinates globally
  let userLat = null;
  let userLon = null;

  // ===============================
  // 👤 PROFILE DROPDOWN LOGIC
  // ===============================
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      profileMenu.classList.add("hidden");
    });

    profileMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // ===============================
  // 🔹 LOAD PRODUCTS
  // ===============================
  async function loadProducts() {

  // ✅ Prevent crash if element not on this page
  if (!productList) {
    return;
  }

  const querySnapshot = await getDocs(collection(db, "products"));
  productList.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
console.log("Product loaded:", data.name);
console.log("Current month:", new Date().getMonth());
let price = Number(data.price) || 0;

// 🎆 FESTIVAL PRICE INCREASE
if (new Date().getMonth() === 10) {
  console.log("Festival month detected");

  if (data.name.toLowerCase().includes("cracker")) {
    console.log("Festival price applied to:", data.name);
    price = Math.round(price * 1.5);
  }
}
// ❄️ Winter cool drink discount
const month = new Date().getMonth();

if (
  (month === 10 || month === 11 || month === 0) &&
  data.name.toLowerCase().includes("cool")
) {
  console.log("Winter discount applied to:", data.name);
  price = Math.round(price * 0.7);
}

const product = {
  id: docSnap.id,
  name: data.name,
  price: price,
  discount: data.discount || 0,
  image: data.image
};
    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
      <div class="card-img">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="rating">★★★★★</div>
      <h3>${product.name}</h3>
      <p>₹${price}</p>
      <button class="add-btn">Add to Cart</button>
    `;

    div.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(product);
    });

    productList.appendChild(div);
  });

  // ✅ run AI after products load
  setTimeout(predictHighDemandProducts, 300);
}
  // ===============================
// 🧠 AI DEMAND FORECASTING (SAFE)
// ===============================
async function updateProductDemandAI() {
  const ordersSnap = await getDocs(collection(db, "orders"));
  const productsSnap = await getDocs(collection(db, "products"));

  const demandMap = {};

  ordersSnap.forEach(doc => {
    const order = doc.data();
    order.items.forEach(item => {
      demandMap[item.name] = (demandMap[item.name] || 0) + item.quantity;
    });
  });

  for (const productDoc of productsSnap.docs) {
    const product = productDoc.data();
    const count = demandMap[product.name] || 0;

    let demandLevel = "LOW";
    if (count >= 10) demandLevel = "HIGH";
    else if (count >= 5) demandLevel = "MEDIUM";

    await addDoc(collection(db, "ai_logs"), {
      product: product.name,
      demandLevel,
      count,
      createdAt: serverTimestamp()
    });
  }

  console.log("🧠 AI Demand Updated");
}
// ===============================
// 💰 DYNAMIC PRICING (SAFE)
// ===============================
async function applyDynamicPricing() {
  const productsSnap = await getDocs(collection(db, "products"));

  for (const docSnap of productsSnap.docs) {
    const product = docSnap.data();
    let newPrice = product.basePrice || product.price;

    if (product.demandLevel === "HIGH") {
      newPrice += 5;
    } else if (product.demandLevel === "LOW") {
      newPrice -= 3;
    }

    await addDoc(collection(db, "price_logs"), {
      product: product.name,
      oldPrice: product.price,
      newPrice,
      createdAt: serverTimestamp()
    });
  }

  console.log("💰 Dynamic Pricing Applied");
}
// ===============================
// 🌦️ WEATHER DEMAND BOOST
// ===============================
function getWeatherDemandBoost() {
  const month = new Date().getMonth();

  if (month >= 3 && month <= 6) return ["Water", "Oil", "Rice"];
  if (month >= 6 && month <= 9) return ["Tea", "Sugar"];
  return [];
}

// ===============================
// 🎉 FESTIVAL DEMAND
// ===============================
function isFestivalSeason() {
  const month = new Date().getMonth();
  return month === 9 || month === 10; // Diwali
}
// ===============================
// 📦 AUTO STOCK ALERT (AI)
// ===============================
async function checkVendorStock() {
  const productsSnap = await getDocs(collection(db, "products"));

  productsSnap.forEach(async docSnap => {
    const product = docSnap.data();

    if (product.stock <= 20 && product.demandLevel === "HIGH") {
      await addDoc(collection(db, "vendor_stock_alerts"), {
        productName: product.name,
        predictedDemand: product.demandLevel,
        stockLeft: product.stock,
        alertStatus: "LOW_STOCK",
        createdAt: serverTimestamp()
      });
    }
  });

  console.log("📦 Stock Alerts Generated");
}

// ===============================
// 🧠 AI DEMAND PREDICTION (RULE-BASED)
// ===============================
async function predictHighDemandProducts() {

  const ordersSnap = await getDocs(collection(db, "orders"));

  const demandMap = {};

  ordersSnap.forEach(docSnap => {

    const order = docSnap.data();

    order.items?.forEach(item => {

      const name = item.name?.toLowerCase().trim();

      const qty = Number(item.quantity ?? item.qty ?? 1);

      if (!demandMap[name]) {
        demandMap[name] = 0;
      }

      demandMap[name] += qty;

    });

  });

  const demandArray = Object.entries(demandMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  console.log("📊 Demand Prediction:", demandArray);

  // DEMO FRIENDLY
  const highDemand = demandArray.filter(p => p.qty >= 1);

  const finalList = highDemand.length
    ? highDemand
    : demandArray.slice(0, 3);

  highlightHighDemand(finalList);

}
// ===============================
// 🔥 HIGHLIGHT HIGH DEMAND PRODUCTS
// ===============================
function highlightHighDemand(topProducts) {

  const cards = document.querySelectorAll(".product");

  cards.forEach(card => {

    const cardName = card.querySelector("h3")?.textContent
      ?.toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const isHighDemand = topProducts.find(p =>
      p.name?.toLowerCase().replace(/\s+/g, " ").trim() === cardName
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
  // ===============================
  // 🔹 CART LOGIC
  // ===============================
function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);

  if (existing) {
    existing.quantity += 1; // ✅ ALWAYS quantity
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      discount: Number(product.discount) || 0,
      image: product.image,
      quantity: 1 // ✅ CRITICAL
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}
function updateCart() {

  cart = JSON.parse(localStorage.getItem("cart")) || [];

  let totalItems = 0;
  let totalPrice = 0;
  let totalDiscount = 0;

  cartItemsDiv.innerHTML = "";

  cart.forEach(item => {

    // ✅ SAFETY FIXES
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;

    totalItems += qty;
    totalPrice += price * qty;
    totalDiscount += discount * qty;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <span>${item.name}</span>
      <span>x${qty}</span>
      <span>₹${price * qty}</span>
    `;

    cartItemsDiv.appendChild(div);
  });

  const payable = totalPrice - totalDiscount;

  // ✅ UPDATE UI
  cartCount.textContent = totalItems;
  cartTotal.textContent = `₹${totalPrice}`;
  discountTotalSpan.textContent = `${totalDiscount}`;
  payableTotalSpan.textContent = `${payable}`;

  // ✅ SAVE CLEAN DATA
  localStorage.setItem("cart", JSON.stringify(cart));
}

  cartBtn.addEventListener("click", () => {
    cartPopup.classList.toggle("hidden");
  });
// 📏 Distance calculation (Haversine Formula)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

  // ===============================
// 📍 DETECT LOCATION (FREE – NO API KEY)
// ===============================
const detectBtn = document.getElementById("detect-btn");
const locationSpan = document.getElementById("user-location");
// 🛒 Start Shopping Button (Correct)
const startBtn = document.getElementById("startBtn");

if (startBtn && detectBtn) {
  startBtn.addEventListener("click", () => {
    alert("📍 Detecting your location to start shopping...");
    detectBtn.click();
  });
}

if (detectBtn && locationSpan) {
  detectBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    detectBtn.textContent = "Detecting...";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        userLat = lat;
        userLon = lon;

        try {
          // 🌍 Reverse Geocoding (OpenStreetMap – FREE)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();

          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "Unknown area";

          const state = data.address.state || "";

         locationSpan.textContent = `📍 ${city}, ${state}`;

// 🔄 Switch pages
const landing = document.getElementById("landingPage");
const vendors = document.getElementById("vendorsPage");

    if (landing && vendors) {
       landing.classList.add("hidden");
       vendors.classList.remove("hidden");
      }
          detectBtn.textContent = "Location Detected";
          loadNearbyVendors(city, state);
          console.log("User Location:", city, state);
          // 💾 SAVE LOCATION TO FIRESTORE
await addDoc(collection(db, "user_locations"), {
  userId: auth.currentUser.uid,
  email: auth.currentUser.email,
  city,
  state,
  latitude: lat,
  longitude: lon,
  createdAt: serverTimestamp()
});
} catch (err) {
          console.error(err);
          alert("Failed to fetch location name");
          detectBtn.textContent = "Detect Location";
        }
      },
      () => {
        alert("Location permission denied");
        detectBtn.textContent = "Detect Location";
      }
    );
  });
}
// ===============================
// 📍 SHOW NEARBY VENDORS
// ===============================
const vendorList = document.getElementById("vendorList");

async function loadNearbyVendors(city, state) {
  vendorList.innerHTML = "Loading nearby vendors...";

  const vendorSnap = await getDocs(collection(db, "vendors"));
  vendorList.innerHTML = "";

  let found = false;

  vendorSnap.forEach(docSnap => {
    const vendor = docSnap.data();

    // 📏 Calculate distance
    // 📏 Calculate distance
const distance = getDistanceKm(
  userLat,
  userLon,
  vendor.latitude,
  vendor.longitude
);

// ✅ SAFE DELIVERY RADIUS
const MAX_RADIUS = Number(vendor.deliveryRadiusKm) || 185;

console.log("Using Radius:", MAX_RADIUS);

// ✅ Distance-based filter
if (distance <= MAX_RADIUS) {
  found = true;

  const div = document.createElement("div");
  div.className = "vendor-card";
  div.innerHTML = `
    <strong>${vendor.name}</strong>
    <p>Category: ${vendor.category}</p>
    <p>Delivery Radius: ${MAX_RADIUS} km</p>
    <p>Distance: ${distance.toFixed(1)} km</p>
    <button onclick="viewShop('${docSnap.id}')">
      View Shop
    </button>
  `;
  vendorList.appendChild(div);
}
  });

  if (!found) {
    vendorList.innerHTML = "No nearby vendors found.";
  }
}
// ===============================
// 🔍 GLOBAL PRODUCT SEARCH → SHOP LIST
// ===============================
const globalSearchInput = document.getElementById("globalSearch");

if (globalSearchInput) {
  globalSearchInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    if (!keyword || userLat === null) return;

    vendorList.innerHTML = "Searching shops...";

    const productsSnap = await getDocs(collection(db, "products"));
    const matchedVendors = new Set();

    productsSnap.forEach(docSnap => {
      const product = docSnap.data();
      if (product.name?.toLowerCase().includes(keyword)) {
        matchedVendors.add(product.vendorId);
      }
    });

    if (matchedVendors.size === 0) {
      vendorList.innerHTML = "No shops found for this product.";
      return;
    }

    const vendorSnap = await getDocs(collection(db, "vendors"));
    vendorList.innerHTML = "";

    vendorSnap.forEach(docSnap => {
      if (!matchedVendors.has(docSnap.id)) return;

      const vendor = docSnap.data();
      if (!vendor.latitude || !vendor.longitude) return;

      const distance = getDistanceKm(
        userLat,
        userLon,
        vendor.latitude,
        vendor.longitude
      );

     const MAX_RADIUS = Number(vendor.deliveryRadiusKm) || 185;

if (distance <= MAX_RADIUS) {
        vendorList.innerHTML += `
          <div class="vendor-card">
            <strong>${vendor.name}</strong>
            <p>Category: ${vendor.category}</p>
            <p>Distance: ${distance.toFixed(1)} km</p>
            <button onclick="viewShop('${docSnap.id}')">View Shop</button>
          </div>
        `;
      }
    });
  });
}

  // ===============================
  // 🔹 SAVE ORDER
  // ===============================
  async function saveOrder(cart, discount, total) {
    await addDoc(collection(db, "orders"), {
      userId: auth.currentUser.uid,
      email: auth.currentUser.email,
      items: cart,
      discount,
      total,
      status: "placed",
      createdAt: serverTimestamp()
    });
  }

  // ===============================
  // 🔹 CHECKOUT
  // ===============================
  const checkoutBtn = document.querySelector(".checkout-btn");

checkoutBtn.addEventListener("click", async () => {

  cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (!cart.length) {
    alert("Your cart is empty!");
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = cart.reduce((s, i) => s + (i.discount || 0) * i.quantity, 0);

  try {
    await saveOrder(cart, discount, total);

    alert("✅ Order placed successfully!");

    // ✅ CLEAR CART
    localStorage.removeItem("cart");
    cart = [];

    updateCart();
    cartPopup.classList.add("hidden");

  } catch (err) {
    console.error(err);
    alert("❌ Order failed");
  }
});

  // ===============================
  // 🔹 LOGOUT
  // ===============================
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await signOut(auth);
      window.location.href = "login.html";
    };
  }

  // ===============================
  // 🔐 AUTH CHECK + ADMIN VISIBILITY
  // ===============================
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
 
if (document.getElementById("productList")) {
  await loadProducts();
}
    // Set user email
    if (profileEmail) profileEmail.textContent = user.email;
    const headerEmail = document.getElementById("user-email");
    if (headerEmail) headerEmail.textContent = user.email;

    // Profile logout
    if (profileLogoutBtn) {
      profileLogoutBtn.onclick = async () => {
        await signOut(auth);
        window.location.href = "login.html";
      };
    }

    // ===== ADMIN VISIBILITY =====
    const adminProfileLink = document.getElementById("adminProfileLink");
    const adminUserBanner = document.getElementById("adminUserBanner");

    try {
      const roleSnap = await getDoc(doc(db, "roles", user.uid));
      if (roleSnap.exists() && roleSnap.data().role === "admin") {
        if (adminProfileLink) adminProfileLink.classList.remove("hidden");
        if (adminUserBanner) adminUserBanner.classList.remove("hidden");
      }
    } catch (e) {
      console.error("Admin role check failed", e);
    }

// setTimeout(updateProductDemandAI, 1500);
// setTimeout(applyDynamicPricing, 2000);
// setTimeout(checkVendorStock, 2500);
// setTimeout(predictHighDemandProducts, 3000);
setTimeout(predictHighDemandProducts, 300);
// 🔙 Back to Home Button
const backBtn = document.getElementById("backHome");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    const landing = document.getElementById("landingPage");
    const vendors = document.getElementById("vendorsPage");

    if (landing && vendors) {
      landing.classList.remove("hidden");
      vendors.classList.add("hidden");
    }
  });
}
  });

});
// ===============================
// 🔗 VIEW SHOP NAVIGATION (GLOBAL)
// ===============================
window.viewShop = function (vendorId) {
  window.location.href = `shop.html?vendorId=${vendorId}`;
};
