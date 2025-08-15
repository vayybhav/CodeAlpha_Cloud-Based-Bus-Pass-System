import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore, collection, doc, runTransaction, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const busDetails = JSON.parse(sessionStorage.getItem("selectedBusDetails"));
  const selectedSeats = JSON.parse(sessionStorage.getItem("selectedSeats")) || [];
  const email = localStorage.getItem("loggedInEmail");
  const userName = localStorage.getItem("userName");

  const busDetailsDiv = document.getElementById("busDetails");
  const statusMsg = document.getElementById("statusMsg");
  const nameInput = document.getElementById("passengerName");

  if (!busDetails || !email) {
    busDetailsDiv.innerHTML = `<p style="color:red;">⚠️ Invalid booking details. Please start over.</p>`;
    return;
  }

  if (nameInput && userName) nameInput.value = userName;

  busDetailsDiv.innerHTML = `
    <h3>${busDetails.busName}</h3>
    <p><strong>Route:</strong> ${busDetails.from} → ${busDetails.to}</p>
    <p><strong>Date:</strong> ${formatDate(busDetails.travelDate)}</p>
    <p><strong>Time:</strong> ${busDetails.time}</p>
    <p><strong>Fare:</strong> ₹${busDetails.price}</p>
    <p><strong>Selected Seats:</strong> ${selectedSeats.length ? selectedSeats.join(", ") : "None"}</p>
  `;

  document.getElementById("confirmBookingBtn").addEventListener("click", async () => {
    const passengerName = nameInput?.value?.trim();
    if (!passengerName) {
      statusMsg.style.color = "red";
      statusMsg.textContent = "Please enter passenger name.";
      return;
    }

    statusMsg.textContent = "";
    statusMsg.style.color = "";

    try {
      await runTransaction(db, async (transaction) => {
        const q = query(collection(db, "bookings"),
          where("busName", "==", busDetails.busName),
          where("from", "==", busDetails.from),
          where("to", "==", busDetails.to),
          where("travelDate", "==", busDetails.travelDate)
        );

        const snapshot = await getDocs(q);
        let bookedSeats = [];
        snapshot.forEach(doc => {
          bookedSeats = bookedSeats.concat(doc.data().selectedSeats || []);
        });

        const conflict = selectedSeats.some(seat => bookedSeats.includes(seat));
        if (conflict) throw "Some selected seats are already booked!";

        const newBookingRef = doc(collection(db, "bookings"));

        transaction.set(newBookingRef, {
          email,
          passengerName,
          busName: busDetails.busName,
          from: busDetails.from,
          to: busDetails.to,
          travelDate: busDetails.travelDate,
          time: busDetails.time,
          price: busDetails.price,
          route: `${busDetails.from} ➡ ${busDetails.to}`,
          selectedSeats,
          paymentMethod: "Cash",
          status: "active",
          timestamp: new Date()
        });
      });

      statusMsg.style.color = "green";
      statusMsg.textContent = "✅ Booking confirmed! Redirecting...";
      sessionStorage.removeItem("selectedBusDetails");
      sessionStorage.removeItem("selectedSeats");

      setTimeout(() => {
        window.location.href = "my-bookings.html";
      }, 1500);

    } catch (err) {
      console.error("Booking failed:", err);
      statusMsg.style.color = "red";
      statusMsg.textContent = typeof err === "string" ? err : "❌ Failed to confirm booking. Try again.";
    }
  });
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}
