import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/convert-custom-token", async (req, res) => {
  const { customToken } = req.body;

  if (!customToken) {
    return res.status(400).json({ error: "customToken is required" });
  }

  try {
    // Call Firebase Secure Token API
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`;

    const response = await axios.post(url, {
      token: customToken,
      returnSecureToken: true
    });

    return res.json({
      success: true,
      message: "Custom token converted to ID token",
      idToken: response.data.idToken,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn
    });

  } catch (error) {
    console.error("Firebase Token Error:", error?.response?.data || error);

    return res.status(400).json({
      error: "Failed to convert custom token",
      details: error?.response?.data || error
    });
  }
});

export default router;
