import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("loggedInEmail");
  if (!email) {
    alert("You are not logged in. Redirecting to homepage.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userEmail").innerText = email;

  try {
    const q = query(collection(db, "bookings"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      document.getElementById("totalBookings").innerText = "0";
      document.getElementById("userName").innerText = "—";
      return;
    }

    const bookings = [];
    querySnapshot.forEach(doc => bookings.push(doc.data()));

    document.getElementById("totalBookings").innerText = bookings.length;

    const upcoming = bookings
      .filter(b => b.status === "active" && new Date(b.travelDate) >= new Date())
      .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate))[0];

    if (upcoming) {
      document.getElementById("nextRoute").innerText = upcoming.route || `${upcoming.from} ➡ ${upcoming.to}`;
      document.getElementById("nextDate").innerText = upcoming.travelDate;
      document.getElementById("userName").innerText = upcoming.passengerName || "—";
    } else {
      document.getElementById("nextRoute").innerText = "None";
      document.getElementById("nextDate").innerText = "N/A";
      document.getElementById("userName").innerText = bookings[0].passengerName || "—";
    }

  } catch (err) {
    console.error("Failed to load profile:", err);
    document.getElementById("userName").innerText = "—";
    document.getElementById("totalBookings").innerText = "0";
  }

  // Optional: Profile picture from localStorage
  const profileImage = document.getElementById("profileImage");
  const uploadInput = document.getElementById("uploadPic");
  const deleteBtn = document.getElementById("deletePicBtn");

  const storedPic = localStorage.getItem("profilePic");
  if (storedPic) profileImage.src = storedPic;
  else profileImage.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(email);

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("profilePic", reader.result);
      profileImage.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  deleteBtn.addEventListener("click", () => {
    localStorage.removeItem("profilePic");
    profileImage.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(email);
  });
});
