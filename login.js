import { auth } from "./firebase.js";
import { db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// DOM elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

/* ======================
   SIGN UP (NO CHANGE)
====================== */
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await sendEmailVerification(userCred.user);

    alert(
      "Signup successful!\nVerification email sent.\nPlease verify before login."
    );

  } catch (error) {
    alert(error.message);
  }
});

/* ======================
   LOGIN (ADMIN + USER)
====================== */
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCred.user;

    // ❌ Block if email not verified
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      alert(
        "Email not verified.\nVerification link sent again."
      );
      return;
    }

    // 🔐 CHECK ROLE FROM FIRESTORE
    const roleRef = doc(db, "roles", user.uid);
    const roleSnap = await getDoc(roleRef);

    if (roleSnap.exists() && roleSnap.data().role === "admin") {
      // ✅ ADMIN LOGIN
      window.location.href = "admin.html";
    } else {
      // ✅ NORMAL USER LOGIN
      window.location.href = "index.html";
    }

  } catch (error) {
    alert(error.message);
  }
});
