import { db } from "../config/firebase.js";

export const agentNotification = async (req, res) => {
  try {
    const { agentId, pushToken } = req.body;

    if (!agentId || !pushToken) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await db.collection("agents").doc(agentId).set(
      { pushToken },
      { merge: true }
    );

    res.json({ success: true, message: "Push token saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save token" });
  }
};
