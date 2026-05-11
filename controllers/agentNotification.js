import { db } from "../config/firebase.js";

export const agentNotification = async (req, res) => {
  try {
    const agentId = req.user.uid;
    const {platform, expoPushToken, fcmToken } = req.body;

    if (!agentId || !platform) {
      return res.status(400).json({ error: "Missing fields" });
    }

const updateData = {
  platform,
  updatedAt: Date.now(),
};

if (platform === "ios") {
  updateData.expoPushToken =
    expoPushToken || null;

  // remove old android token
  updateData.fcmToken = null;
}

if (platform === "android") {
  updateData.fcmToken =
    fcmToken || null;

  // remove old ios token
  updateData.expoPushToken = null;
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