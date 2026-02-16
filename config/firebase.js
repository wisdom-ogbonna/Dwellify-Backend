import admin from "firebase-admin";
import "dotenv/config";

// Decode Base64 service account JSON
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Example: 'your-project-id.appspot.com'
});

// Initialize Firestore and Storage Bucket
const db = admin.firestore();
const bucket = admin.storage().bucket();
const messaging = admin.messaging(); // ✅ ADD THIS

// Export named instances
export { admin, db, bucket,messaging };
