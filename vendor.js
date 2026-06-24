import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

document.getElementById("addProductBtn").addEventListener("click", async () => {
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const image = document.getElementById("productImage").value.trim();

  if (!name || !price || !image) {
    alert("Fill all fields");
    return;
  }

  // ✅ SAFE & PROFESSIONAL METHOD
  await addDoc(collection(db, "products"), {
    name,
    price,
    image,
    vendorId: auth.currentUser.uid, // 🔥 KEY LINE
    createdAt: serverTimestamp()
  });

  alert("Product added successfully");

  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productImage").value = "";
});
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const roleSnap = await getDoc(doc(db, "roles", auth.currentUser.uid));
if (roleSnap.data().role !== "vendor") {
  alert("Access denied");
  window.location.href = "index.html";
}
