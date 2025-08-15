// otp.js

const apiBase = 'http://localhost:3000';

function sendOTP() {
  const email = document.getElementById('userEmail').value.trim();

  if (!email) {
    alert("Please enter a valid email.");
    return;
  }

  fetch(`${apiBase}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('otp-box').style.display = 'block';
        localStorage.setItem('loggedInEmail', email);
        document.getElementById('status').innerText = "OTP sent to your email.";
      } else {
        document.getElementById('status').innerText = "Failed to send OTP.";
      }
    })
    .catch(() => {
      document.getElementById('status').innerText = "Error sending OTP.";
    });
}

function verifyOTP() {
  const email = localStorage.getItem('loggedInEmail');
  const otp = document.getElementById('userOTP').value.trim();

  if (!otp || !email) {
    alert("Enter your OTP and email first.");
    return;
  }

  fetch(`${apiBase}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Login successful!");
        window.location.href = "index.html"; // Redirect to booking
      } else {
        alert("Incorrect OTP. Please try again.");
      }
    })
    .catch(() => {
      alert("Server error verifying OTP.");
    });
}
