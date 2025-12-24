import { db } from "../config/firebase.js";

export const getAgentProfile = async (req, res) => {
  try {
    const { uid } = req.params;

    // 🔐 Ensure user is requesting their own data
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const docRef = db.collection("users").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const data = docSnap.data();

    if (data.role !== "agent" || !data.agentDetails) {
      return res.status(400).json({ error: "User is not an agent" });
    }

    return res.status(200).json({
      name: data.agentDetails.name,
      email: data.agentDetails.email,
      phone: data.agentDetails.phone,
      address: data.agentDetails.address,
      agencyName: data.agentDetails.agencyName,
      licenseId: data.agentDetails.licenseId,
      verified: data.agentDetails.verified,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch agent profile",
      details: error.message,
    });
  }
};

export const verifyAgent = async (req, res) => {
  const {
    uid,
    name,
    email,
    address,
    phone,
    agencyName,
    licenseId,
  } = req.body;

  // 1️⃣ Basic validation
  if (!uid || !name || !email || !address) {
    return res.status(400).json({
      error: "uid, name, email, and address are required",
    });
  }

  try {
    // 2️⃣ Get user document
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    // 3️⃣ Ensure user is an agent
    const userData = userSnap.data();

    if (userData.role !== "agent") {
      return res.status(403).json({
        error: "Only agents can submit verification",
      });
    }

    // 4️⃣ Save agent details
    await userRef.set(
      {
        agentDetails: {
          name,
          email,
          address,
          phone: phone || null,
          agencyName: agencyName || null,
          licenseId: licenseId || null,
          verified: false,
          submittedAt: new Date(),
        },
        agentStatus: "submitted",
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: "Agent verification submitted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to submit agent verification",
      details: error.message,
    });
  }
};
