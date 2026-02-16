import { db } from "../config/firebase.js";

export const agentNotification = async (req, res) => {
  try {
    const { agentId, platform, expoPushToken, fcmToken } = req.body;

    if (!agentId || !platform) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const updateData = { platform };

    if (platform === "ios" && expoPushToken) {
      updateData.expoPushToken = expoPushToken;
    }

    if (platform === "android" && fcmToken) {
      updateData.fcmToken = fcmToken;
    }

    await db.collection("agents").doc(agentId).set(updateData, {
      merge: true,
    });

    res.json({ success: true, message: "Push token saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save token" });
  }
};