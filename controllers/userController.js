import admin from "../config/firebase.js";


// ✅ API to set user role (agent or client)
export const setUserRole = async (req, res) => {
  const { uid, role } = req.body;

  if (!uid || !role) {
    return res.status(400).json({ error: "uid and role are required" });
  }

  if (!["agent", "client"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'agent' or 'client'." });
  }

  try {
    // 🔹 Save role in Firebase custom claims
    await admin.auth().setCustomUserClaims(uid, { role });

    // 🔹 Optionally store extra user info in Firestore
    const db = admin.firestore();
    await db.collection("users").doc(uid).set(
      {
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: `User role set to ${role}`,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to set user role",
      details: error.message,
    });
  }
};
