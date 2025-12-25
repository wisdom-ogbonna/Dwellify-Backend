import axios from "axios";
import { admin, db } from "../config/firebase.js";

/* =========================
   SEND OTP (UNCHANGED)
========================= */
export const sendOTP = async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const response = await axios.post(
      `${process.env.TERMII_BASE_URL}/api/sms/otp/send`,
      {
        api_key: process.env.TERMII_API_KEY,
        message_type: "NUMERIC",
        to: phone_number,
        from: process.env.TERMII_SENDER_ID,
        channel: process.env.TERMII_CHANNEL,
        pin_attempts: 3,
        pin_time_to_live: 30,
        pin_length: 6,
        pin_placeholder: "<123456>",
        message_text:
          "Your Bytemark Institute verification code is <123456>. It expires in 30 minutes.",
        pin_type: "NUMERIC",
      }
    );

    return res.status(200).json({
      success: true,
      pin_id: response.data?.pin_id,
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to send OTP",
      details: error.response?.data || error.message,
    });
  }
};

/* =========================
   VERIFY OTP (UPDATED)
========================= */
export const verifyOTP = async (req, res) => {
  const { pin_id, pin, phone_number } = req.body;

  if (!pin_id || !pin || !phone_number) {
    return res
      .status(400)
      .json({ error: "pin_id, pin, and phone_number are required" });
  }

  try {
    /* 1️⃣ Verify OTP with Termii */
    const response = await axios.post(
      `${process.env.TERMII_BASE_URL}/api/sms/otp/verify`,
      {
        api_key: process.env.TERMII_API_KEY,
        pin_id,
        pin,
      }
    );

    const verified =
      response.data?.verified === true ||
      response.data?.verified === "true" ||
      response.data?.status === "success";

    if (!verified) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    /* 2️⃣ Get or Create Firebase Auth User */
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByPhoneNumber(phone_number);
    } catch {
      userRecord = await admin.auth().createUser({
        phoneNumber: phone_number,
      });
    }

    /* 3️⃣ Check Firestore for existing role */
    const userRef = db.collection("users").doc(userRecord.uid);
    const userSnap = await userRef.get();

    let role = null;
    let agentStatus = null;
    let isNewUser = false;

    if (userSnap.exists) {
      role = userSnap.data().role || null;
      agentStatus = userSnap.data().agentStatus || null;
    } else {
      // New user → create base record
      await userRef.set({
        uid: userRecord.uid,
        phoneNumber: phone_number,
        verified: true,
        createdAt: new Date(),
      });
      isNewUser = true;
    }

    /* 4️⃣ Create Firebase Custom Token */
    const firebaseToken = await admin
      .auth()
      .createCustomToken(userRecord.uid);

    /* 5️⃣ RETURN ROLE INFO 🔥 */
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      firebaseToken,
      uid: userRecord.uid,
      role,          // ← EXISTING ROLE
      agentStatus,   // ← FOR AGENTS
      isNewUser,     // ← FOR FRONTEND LOGIC
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to verify OTP",
      details: error.response?.data || error.message,
    });
  }
};
