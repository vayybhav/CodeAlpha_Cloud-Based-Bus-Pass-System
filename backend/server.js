// backend/server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const { saveOtp, getOtp, deleteOtp } = require('./otpStore'); // ✅ Import from otpStore.js

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Firebase + Firestore Setup
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ✅ Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ✅ Send OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).send("Email is required");

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).send("User not found. Please sign up first.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOtp(email, otp); // 🔐 Save with expiry

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your PortkeyGo OTP",
      text: `Your OTP is: ${otp} (valid for 10 minutes)`,
    };

    await transporter.sendMail(mailOptions);
    res.send("OTP sent!");
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).send("Error sending OTP.");
  }
});

// ✅ Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp: enteredOtp } = req.body;
  const record = getOtp(email);

  if (!record) {
    return res.status(400).json({ success: false, message: 'OTP not found or expired. Please request again.' });
  }

  const { otp, expiry } = record;

  if (Date.now() > expiry) {
    deleteOtp(email);
    return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
  }

  if (enteredOtp !== otp) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
  }

  deleteOtp(email);
  res.json({ success: true, message: 'OTP verified successfully.' });
});

// ✅ Create User (for Sign Up)
app.post("/create-user", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).send("Name and email are required");
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return res.status(400).send("User already exists.");
    }

    await addDoc(collection(db, "users"), {
      name,
      email,
      createdAt: new Date()
    });

    res.status(200).send("User created successfully.");
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).send("Failed to create user.");
  }
});

// ✅ Fetch user by email (for Login to retrieve name)
app.get("/get-user", async (req, res) => {
  const { email } = req.query;

  if (!email) return res.status(400).send("Email required");

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return res.status(404).send("User not found");

    const userDoc = snapshot.docs[0].data();
    res.json({ name: userDoc.name });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Server error");
  }
});

// ✅ Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
