# PortkeyGo – Test Report

## ✅ Functional Testing
| Feature | Test Performed | Result |
|---------|----------------|--------|
| Email OTP Login | Entered email → Received OTP → Verified within 10 minutes | Pass |
| Bus Search | Selected route/date → Matching buses displayed | Pass |
| Seat Selection | Selected seat → Booked → Seat locked for others instantly | Pass |
| Server-Side Pricing Validation | Tried price tamper via console → Server rejected | Pass |
| PDF Ticket Download | Clicked 'Download PDF' → Correct themed PDF generated | Pass |
| Ticket Retention | Canceled ticket → Remained visible until travel date | Pass |
| Automatic Expired Booking Cleanup | After travel date → Booking removed automatically | Pass |
| Navigation | Home button, My Bookings, and Profile work as intended | Pass |


---

## 🔄 Load Testing
- Simulated 50 concurrent booking requests.
- All processed successfully without errors.
- Firebase automatically scaled to handle load.

---

## 📱 Cross-Device Testing
- **Desktop:** Chrome, Firefox, Edge – No layout issues.
- **Mobile:** Android (Chrome), iOS (Safari) – Responsive and functional.

---

**Conclusion:** PortkeyGo meets all functional, scalability, and security requirements and runs smoothly across devices.
