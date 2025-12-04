import { admin } from "../config/firebase.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid }; // ✅ This is what req.user.uid means
    next();
  } catch (error) {
    console.error("Firebase token error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
