// backend/otpStore.js

const otpMap = new Map();

function saveOtp(email, otp) {
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpMap.set(email, { otp, expiry });
}

function getOtp(email) {
  return otpMap.get(email);
}

function deleteOtp(email) {
  otpMap.delete(email);
}

module.exports = { saveOtp, getOtp, deleteOtp };
