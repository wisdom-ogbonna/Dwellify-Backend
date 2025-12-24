import { admin, db } from "../config/firebase.js";

export const assignRole = async (req, res) => {
  const { uid, role } = req.body;

  if (!uid || !role) {
    return res.status(400).json({ error: "uid and role are required" });
  }

  if (!["client", "agent"].includes(role.toLowerCase())) {
    return res.status(400).json({ error: "Invalid role." });
  }

  try {
    // Set Firebase custom claim
    await admin.auth().setCustomUserClaims(uid, { role });

    // Save role only
    await db.collection("users").doc(uid).set(
      {
        role,
        agentStatus: role === "agent" ? "pending" : null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: "Role assigned successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to assign role",
      details: error.message,
    });
  }
};
