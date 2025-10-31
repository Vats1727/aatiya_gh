import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =======================
// 🔥 Firebase Initialization
// =======================
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    console.log("✅ GOOGLE_SERVICE_ACCOUNT_BASE64 variable found. Decoding...");

    const serviceAccountBuffer = Buffer.from(
      process.env.GOOGLE_SERVICE_ACCOUNT_BASE64,
      "base64"
    );
    const serviceAccount = JSON.parse(serviceAccountBuffer.toString("utf-8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase initialized from GOOGLE_SERVICE_ACCOUNT_BASE64");
  } else {
    console.warn("⚠️ GOOGLE_SERVICE_ACCOUNT_BASE64 not found — trying local file...");

    admin.initializeApp({
      credential: admin.credential.cert("./serviceAccountKey.json"),
    });

    console.log("✅ Firebase initialized from serviceAccountKey.json");
  }
} catch (err) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", err);
  console.log(
    "🔍 GOOGLE_SERVICE_ACCOUNT_BASE64 length:",
    process.env.GOOGLE_SERVICE_ACCOUNT_BASE64
      ? process.env.GOOGLE_SERVICE_ACCOUNT_BASE64.length
      : 0
  );
}

// =======================
// 🔗 Example Routes
// =======================
app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

// Example protected route (optional)
app.post("/api/test", (req, res) => {
  res.json({ message: "Test endpoint working fine!" });
});

// =======================
// ⚙️ Server Start
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
