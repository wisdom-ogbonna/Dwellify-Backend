import { db } from "../config/firebase.js";

export const agentNotification = async (req, res) => {
  try {
    const { agentId, pushToken, fcmToken, platform } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "agentId is required" });
    }

    if (!pushToken && !fcmToken) {
      return res.status(400).json({ error: "pushToken or fcmToken required" });
    }

    const updateData = {
      updatedAt: Date.now(),
    };

    // Save Expo/APNs token (mostly iOS, sometimes Android Expo)
    if (pushToken) {
      updateData.pushToken = pushToken;
    }

    // Save Firebase Cloud Messaging token (mostly Android, sometimes iOS Firebase)
    if (fcmToken) {
      updateData.fcmToken = fcmToken;
    }

    // Save platform for debugging & targeting
    if (platform) {
      updateData.platform = platform; // "android" or "ios"
    }

    await db.collection("agents").doc(agentId).set(updateData, { merge: true });

    console.log("✅ Token(s) saved for agent:", agentId);

    res.json({
      success: true,
      message: "Push token(s) saved successfully",
    });

  } catch (err) {
    console.error("❌ Token Save Error:", err);
    res.status(500).json({ error: "Failed to save token" });
  }
};
