import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5O1-AjQaDMUkmIgONMHduLwGiUK8_r3c",
  authDomain: "local-vendor-marketplace.firebaseapp.com",
  projectId: "local-vendor-marketplace",
  storageBucket: "local-vendor-marketplace.firebasestorage.app",
  messagingSenderId: "460562890916",
  appId: "1:460562890916:web:4bc7d98427c677340e6631"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);   // ✅ REQUIRED
export const db = getFirestore(app);
