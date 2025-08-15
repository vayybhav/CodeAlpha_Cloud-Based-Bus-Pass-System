document.addEventListener("DOMContentLoaded", () => {
  const fromCity = sessionStorage.getItem("fromCity");
  const toCity = sessionStorage.getItem("toCity");
  const travelDate = sessionStorage.getItem("travelDate");

  const journeyDetails = document.getElementById("journeyDetails");
  const busList = document.getElementById("busList");

  if (!fromCity || !toCity || !travelDate) {
    journeyDetails.textContent = "Missing journey information. Please search again.";
    return;
  }

  journeyDetails.textContent = `Showing buses from ${fromCity} to ${toCity} on ${formatDate(travelDate)}`;

  const cities = ["Panipat", "Karnal", "Delhi", "Gurgaon", "Ambala", "Chandigarh", "Amritsar"];
  const times = ["08:00 AM", "12:30 PM", "05:45 PM", "09:00 PM"];
  const price = 145;

  const allBuses = [];
  for (const from of cities) {
    for (const to of cities) {
      if (from !== to) {
        times.forEach((time, idx) => {
          allBuses.push({
            name: `Nimbus-${from.slice(0, 3).toUpperCase()}${to.slice(0, 3).toUpperCase()}-${idx + 1}`,
            from,
            to,
            time,
            price,
          });
        });
      }
    }
  }

  const matchingBuses = allBuses.filter(bus => bus.from === fromCity && bus.to === toCity);

  if (matchingBuses.length === 0) {
    busList.innerHTML = `<p style="text-align:center; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 1rem; color: #d1d9ff;">No buses found for this route.</p>`;
    return;
  }

  const now = new Date();

  matchingBuses.forEach((bus, index) => {
    // Determine if bus has already departed
    const busDateTime = new Date(`${travelDate} ${bus.time}`);
    const departed = busDateTime < now;

    const card = document.createElement("div");
    card.className = "bus-card";

    card.innerHTML = `
      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; font-family: 'Montserrat', sans-serif; color: gold;">${bus.name}</h3>
      <p style="font-size: 1rem; font-weight: 500; margin: 6px 0; font-family: 'Montserrat', sans-serif;">Route: <strong>${bus.from} → ${bus.to}</strong></p>
      <p style="font-size: 1rem; font-weight: 500; margin: 6px 0; font-family: 'Montserrat', sans-serif;">Time: <strong>${bus.time}</strong></p>
      <p style="font-size: 1rem; font-weight: 500; margin: 6px 0; font-family: 'Montserrat', sans-serif;">Price: <strong>₹${bus.price}</strong></p>
      <p class="payment-info" style="font-size: 0.9rem; font-weight: 400; padding: 6px 10px; margin: 14px 0 20px 0; color: #b2fff7; background: rgba(0, 255, 255, 0.1); border-radius: 8px; font-family: 'Montserrat', sans-serif;">
        <em>Payment: Cash Only.</em>
      </p>
      <button class="book-btn" data-bus-index="${index}" style="font-size: 1rem; padding: 10px 20px; font-weight: 600; font-family: 'Montserrat', sans-serif;" ${departed ? "disabled" : ""}>
        ${departed ? "Already Departed" : "Book Now"}
      </button>
    `;

    busList.appendChild(card);
  });

  document.querySelectorAll(".book-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const email = localStorage.getItem("loggedInEmail");
      if (!email) {
        if (confirm("Please login first to continue booking.\nClick OK to login or Cancel to go Home.")) {
          window.location.href = "auth.html";
        } else {
          window.location.href = "index.html";
        }
        return;
      }

      const busIndex = e.target.getAttribute("data-bus-index");
      const selectedBus = matchingBuses[busIndex];

      const bookingData = {
        busName: selectedBus.name,
        from: fromCity,
        to: toCity,
        travelDate,
        time: selectedBus.time,
        price: selectedBus.price
      };

      sessionStorage.setItem("selectedBusDetails", JSON.stringify(bookingData));
      window.location.href = "seat-selection.html";
    });
  });
});

function formatDate(dateStr) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-IN', options);
}
