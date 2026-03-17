import { db } from "../config/firebase.js";

/* =========================
   CLIENT VERIFICATION
========================= */
export const verifyClient = async (req, res) => {
  const { uid, name, email } = req.body;

  if (!uid || !name || !email) {
    return res.status(400).json({
      error: "uid, name, and email are required",
    });
  }

  try {
    // 🔐 Ensure user verifies their own account
    if (req.user.uid !== uid) {
      return res.status(403).json({
        error: "Unauthorized request",
      });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const userData = userSnap.data();

    // Ensure role is client
    if (userData.role !== "client") {
      return res.status(403).json({
        error: "Only clients can verify client profile",
      });
    }

    // Save client details
    await userRef.set(
      {
        clientDetails: {
          name,
          email,
          verified: true,
          submittedAt: new Date(),
        },
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: "Client verification successful",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to verify client",
      details: error.message,
    });
  }
};

/* =========================
   GET CLIENT PROFILE
========================= */
export const getClientProfile = async (req, res) => {
  try {
    const { uid } = req.params;

    console.log("PARAM UID:", uid);
    console.log("TOKEN UID:", req.user?.uid);

    if (req.user.uid !== uid) {
      return res.status(403).json({
        error: "Unauthorized access",
      });
    }

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    const data = doc.data();

    console.log("USER DATA:", data);

    if (data.role !== "client" || !data.clientDetails) {
      return res.status(400).json({
        error: "User is not a client",
      });
    }

    return res.status(200).json({
      name: data.clientDetails.name,
      email: data.clientDetails.email,
      verified: data.clientDetails.verified,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch client profile",
      details: error.message,
    });
  }
};