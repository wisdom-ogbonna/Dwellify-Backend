import { admin } from "../config/firebase.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken; // ✅ keep everything
    next();
  } catch (error) {
    console.error("Firebase token error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
