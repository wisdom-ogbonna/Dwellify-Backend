import { db } from "../config/firebase.js";

export const agentNotification = async (req, res) => {
  try {
    const { agentId, pushToken, fcmToken, platform } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "agentId is required" });
    }

    if (!pushToken && !fcmToken) {
      return res.status(400).json({ error: "At least one token required" });
    }

    // 🔹 Ensure notification object exists
    const updateData = {
      updatedAt: Date.now(),
      notification: {}, // create notification object
    };

    // 🔹 Save Expo push token
    if (pushToken && pushToken.startsWith("ExponentPushToken")) {
      updateData.notification.expoToken = pushToken;
    }

    // 🔹 Save FCM token
    if (fcmToken) {
      updateData.notification.fcmToken = fcmToken;
    }

    // 🔹 Save platform
    if (platform) {
      updateData.platform = platform; // android | ios
    }

    // 🔹 Merge with existing data in Firestore
    await db.collection("agents").doc(agentId).set(updateData, { merge: true });

    console.log("✅ Tokens saved for agent:", agentId);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Token Save Error:", err);
    res.status(500).json({ error: "Failed to save token" });
  }
};
