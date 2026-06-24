// ===== CART STORAGE =====
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

// ===== ADD TO CART =====
window.addToCartShop = function(id, name, price, image) {

  let cart = getCart();

  const existing = cart.find(p => p.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      image,
      qty: 1
    });
  }

  saveCart(cart);
  alert("Added to cart!");
};

// ===== UPDATE HEADER UI =====
window.updateCartUI = function() {

  const cart = getCart();

  let count = 0;
  let total = 0;

  cart.forEach(p => {
    count += p.qty;
    total += p.price * p.qty;
  });

  const c = document.getElementById("cart-count");
  const t = document.getElementById("cart-total");

  if (c) c.textContent = count;
  if (t) t.textContent = "₹" + total;
};

// Run on load
updateCartUI();