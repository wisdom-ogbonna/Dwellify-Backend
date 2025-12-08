import { admin, db } from "../config/firebase.js";

export const assignRole = async (req, res) => {
  const { uid, role, agentDetails } = req.body;

  if (!uid || !role) {
    return res.status(400).json({ error: "uid and role are required" });
  }

  if (!["client", "agent"].includes(role.toLowerCase())) {
    return res.status(400).json({ error: "Invalid role." });
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });

    const userData = {
      role,
      updatedAt: new Date(),
    };

    if (role === "agent") {
      if (!agentDetails) {
        return res.status(400).json({ error: "Agent details are required." });
      }

      const { name, email, address, phone, agencyName, licenseId } = agentDetails;

      if (!name || !email || !address) {
        return res.status(400).json({ error: "Name, email, and address are required." });
      }

      userData.agentDetails = {
        name,
        email,
        address,
        phone: phone || null,
        agencyName: agencyName || null,
        licenseId: licenseId || null,
        createdAt: new Date(),
        verified: false,
      };
    }

    // Save to Firestore
    await db.collection("users").doc(uid).set(userData, { merge: true });

    // RETURN CUSTOM TOKEN
    const firebaseToken = await admin.auth().createCustomToken(uid);

    return res.status(200).json({
      success: true,
      message:
        role === "agent"
          ? "Agent role and details saved successfully."
          : "Client role saved successfully.",
      firebaseToken,
      data: userData,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to assign role",
      details: error.message,
    });
  }
};
