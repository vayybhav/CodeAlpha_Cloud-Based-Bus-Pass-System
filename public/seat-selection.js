document.addEventListener("DOMContentLoaded", async () => {
  const seatGrid = document.getElementById("seatGrid");
  const selectedSeatsText = document.getElementById("selectedSeats");
  const confirmBtn = document.getElementById("confirmSeatsBtn");

  const totalSeats = 32;
  let bookedSeats = [];
  let selectedSeats = [];

  const busDetails = JSON.parse(sessionStorage.getItem("selectedBusDetails"));
  const travelDate = busDetails?.travelDate || sessionStorage.getItem("selectedDate");

  if (!busDetails || !travelDate) {
    alert("Bus details not found. Please search again.");
    window.location.href = "search-results.html";
    return;
  }

  const db = firebase.firestore();

  // Fetch booked seats from Firestore
  try {
    const snapshot = await db.collection("bookings")
      .where("busName", "==", busDetails.busName)
      .where("from", "==", busDetails.from)
      .where("to", "==", busDetails.to)
      .where("travelDate", "==", travelDate)
      .get();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (Array.isArray(data.selectedSeats)) {
        bookedSeats = bookedSeats.concat(data.selectedSeats.map(s => String(s)));
      }
    });
  } catch (error) {
    console.error("Error fetching booked seats:", error);
  }

  // Generate seat grid
  for (let i = 1; i <= totalSeats; i++) {
    const seat = document.createElement("div");
    seat.classList.add("seat");
    seat.textContent = i;

    if (bookedSeats.includes(String(i))) {
      seat.classList.add("booked");
      seat.style.pointerEvents = "none";
      seat.style.opacity = "0.5";
      seat.title = "❌ Already booked"; // tooltip
    }

    seat.addEventListener("click", () => {
      if (seat.classList.contains("booked")) return;

      seat.classList.toggle("selected");

      if (seat.classList.contains("selected")) {
        selectedSeats.push(i);
      } else {
        selectedSeats = selectedSeats.filter(s => s !== i);
      }

      selectedSeatsText.textContent =
        `Selected Seats: ${selectedSeats.length ? selectedSeats.join(", ") : "None"}`;
    });

    seatGrid.appendChild(seat);
  }

  confirmBtn.addEventListener("click", () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
    window.location.href = "booking-confirmation.html";
  });
});
