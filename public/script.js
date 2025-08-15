// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem('loggedInEmail');

  // ✅ Pre-fill email field if present (on booking-confirmation.html)
  const emailInput = document.getElementById('email');
  if (emailInput && email) {
    emailInput.value = email;
  }

  // ✅ Booking logic (used on booking-confirmation.html)
  const bookingForm = document.getElementById('bookingForm');
  bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please login to confirm your booking.");
      return;
    }

    const fromCity = sessionStorage.getItem("fromCity");
    const toCity = sessionStorage.getItem("toCity");
    const travelDate = sessionStorage.getItem("travelDate");
    const selectedBus = JSON.parse(sessionStorage.getItem("selectedBusDetails"));

    if (!fromCity || !toCity || !travelDate || !selectedBus) {
      document.getElementById('statusMsg').innerText = "Missing booking information.";
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        email,
        name: selectedBus.name,
        busName: selectedBus.name,
        route: `${fromCity} to ${toCity}`,
        from: fromCity,
        to: toCity,
        travelDate,
        time: selectedBus.time,
        price: selectedBus.price,
        status: "active",
        timestamp: new Date()
      });

      document.getElementById('statusMsg').innerText = "✅ Booking confirmed!";
      bookingForm.reset();
    } catch (error) {
      console.error("Error booking:", error);
      document.getElementById('statusMsg').innerText = "❌ Booking failed. Try again.";
    }
  });
});
