import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem('loggedInEmail');

  if (!email) {
    if (confirm("You need to login first to view your bookings.\n\nClick OK to Login or Cancel to go Home.")) {
      window.location.href = "auth.html";
    } else {
      window.location.href = "index.html";
    }
    return;
  }

  const bookingsList = document.getElementById('bookingsList');

  try {
    const q = query(collection(db, "bookings"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      bookingsList.innerHTML = "<p>No bookings found.</p>";
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredCancelledIds = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const bookingDateObj = new Date(data.travelDate);
      bookingDateObj.setHours(0, 0, 0, 0);
      let status = data.status || "active";

      if (status === "active" && bookingDateObj < today) {
        await updateDoc(doc(db, "bookings", docSnap.id), { status: "expired" });
        status = "expired";
      }

      if (status === "cancelled" && bookingDateObj < today) {
        expiredCancelledIds.push(docSnap.id);
        continue; 
      }

      const passengerName = data.passengerName || "—";
      const busName = data.busName || data.name || "—";
      const route = data.route || `${data.from} ➡ ${data.to}`;
      const seatList = data.selectedSeats?.length ? data.selectedSeats.join(", ") : "—";

      let statusText = "✅ Active";
      if (status === "cancelled") statusText = "❌ Ticket Cancelled";
      else if (status === "expired") statusText = "🕒 Trip Completed";

      const div = document.createElement("div");
      div.className = "booking";

      div.innerHTML = `
        <p><strong>Passenger Name:</strong> ${passengerName}</p>
        <p><strong>Bus Name:</strong> ${busName}</p>
        <p><strong>Route:</strong> ${route}</p>
        <p><strong>Travel Date:</strong> ${data.travelDate}</p>
        <p><strong>Seats:</strong> ${seatList}</p>
        <p><strong>Booking ID:</strong> ${docSnap.id}</p>
        <p><strong>Status:</strong> ${statusText}</p>

        ${status === "active" ? `<button class="cancel-btn" data-id="${docSnap.id}">Cancel Booking</button>` : ""}
        ${status === "active" ? `
          <button class="download-btn" data-booking='${JSON.stringify({ ...data, passengerName, busName, route, status }).replace(/"/g, '&quot;')}' data-id="${docSnap.id}">
            <i class="fas fa-download"></i> Download PDF
          </button>` : ""}
        ${status === "cancelled" ? `
          <button class="delete-btn" data-id="${docSnap.id}" style="margin-top:10px; background:#ccc; color:red; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">
            Delete Record
          </button>` : ""}
        <hr/>
      `;

      bookingsList.appendChild(div);
    }

    // Clear expired cancelled bookings
    const clearExpiredBtn = document.getElementById("clearExpiredBtn");
    clearExpiredBtn?.addEventListener("click", async () => {
      if (!expiredCancelledIds.length) {
        alert("No expired cancelled bookings to clear.");
        return;
      }

      if (!confirm(`Are you sure you want to delete ${expiredCancelledIds.length} expired cancelled booking(s)?`)) return;

      try {
        await Promise.all(
          expiredCancelledIds.map(id => deleteDoc(doc(db, "bookings", id)))
        );
        alert("✅ Expired cancelled bookings cleared.");
        location.reload();
      } catch (err) {
        console.error(err);
        alert("❌ Failed to clear some bookings.");
      }
    });

    // Cancel booking
    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bookingId = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to cancel this booking?")) {
          try {
            await updateDoc(doc(db, "bookings", bookingId), { status: "cancelled" });
            alert("✅ Booking cancelled.");
            location.reload();
          } catch (err) {
            console.error(err);
            alert("❌ Failed to cancel booking.");
          }
        }
      });
    });

    // Delete cancelled booking
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bookingId = btn.getAttribute("data-id");
        if (confirm("Delete this cancelled booking permanently?")) {
          try {
            await deleteDoc(doc(db, "bookings", bookingId));
            alert("🗑️ Cancelled booking deleted.");
            location.reload();
          } catch (err) {
            alert("❌ Failed to delete booking.");
            console.error(err);
          }
        }
      });
    });

    // Download PDF
    document.querySelectorAll(".download-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bookingData = JSON.parse(btn.getAttribute("data-booking"));
        const bookingId = btn.getAttribute("data-id");
        generatePDF(bookingData, bookingId);
      });
    });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    bookingsList.innerHTML = "<p>Error loading bookings. Try again later.</p>";
  }
});

function generatePDF(data, bookingId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const {
    passengerName = "—",
    busName = "—",
    route = "—",
    travelDate = "—",
    time = "—",
    price = "—",
    selectedSeats = [],
    status = "active"
  } = data;

  // Parchment background
  doc.setFillColor(245, 235, 200);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(2);
  doc.rect(40, 40, pageWidth - 80, pageHeight - 80, 'S');

  // Header
  doc.setFont("Times", "bold");
  doc.setFontSize(32);
  doc.setTextColor(184, 134, 11);
  doc.text("PortkeyGo", pageWidth / 2, 90, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("Times", "normal");
  doc.setTextColor(80, 50, 20);
  doc.text("From anywhere to everywhere", pageWidth / 2, 115, { align: "center" });

  // Greeting
  doc.setFontSize(14);
  doc.text(`Dear ${passengerName},`, 60, 160);
  doc.text("We are pleased to confirm your magical journey via PortkeyGo.", 60, 180);

  // Journey Details Box
  const boxX = 50, boxY = 210, boxWidth = pageWidth - 100, boxHeight = 160;
  doc.setFillColor(250, 245, 220);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10, 10, 'F');

  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(1.5);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10, 10, 'S');

  // Journey details inside box
  const details = [
    `Bus Name: ${busName}`,
    `Route: ${route}`,
    `Travel Date: ${travelDate}`,
    `Departure Time: ${time}`,
    `Seats: ${selectedSeats.length ? selectedSeats.join(", ") : "—"}`,
    `Fare: Rs.${price}`,
    `Status: ${status === "cancelled" ? "❌ Cancelled" : (status === "expired" ? "🕒 Trip Completed" : "Confirmed")}`
  ];

  doc.setFont("Times", "normal");
  doc.setTextColor(80, 50, 20);
  doc.setFontSize(13);
  details.forEach((line, i) => {
    doc.text(line, boxX + 20, boxY + 30 + i * 20);
  });

  // Footer
  doc.setFont("Times", "italic");
  doc.setFontSize(12);
  doc.text(
    "Keep this ticket safe. Present it at boarding. Thank you for choosing PortkeyGo!",
    pageWidth / 2,
    boxY + boxHeight + 40,
    { align: "center" }
  );

  // Save PDF
  doc.save(`PortkeyGo_Ticket_${bookingId}.pdf`);
}
