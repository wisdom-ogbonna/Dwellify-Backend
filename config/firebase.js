import admin from "firebase-admin";
import "dotenv/config";
// ✅ Decode Base64 back into JSON
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
