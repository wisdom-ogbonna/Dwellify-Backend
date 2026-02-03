import { db } from "../config/firebase.js";
import { sendPushNotification } from "../utils/push.js";

export const clinetRequest = async (req, res) => {
  try {
    const { agentId, clientId, clientName, propertyType, lat, lng } = req.body;

    // 1️⃣ Validate input
    if (!agentId || !clientId || !propertyType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure numbers for location
    const latitude = Number(lat);
    const longitude = Number(lng);

    // 2️⃣ Create Firestore request first
    const docRef = await db.collection("agent_requests").add({
      agentId,
      clientId,
      clientName: clientName || "A client",
      propertyType,
      lat: latitude,
      lng: longitude,
      status: "pending",
      createdAt: Date.now(),
    });

    console.log(`✅ Request created: ${docRef.id}`);

    // 3️⃣ Fetch agent push token (works for both Android & iOS)
    const agentSnap = await db.collection("agents").doc(agentId).get();

    if (!agentSnap.exists) {
      console.log("⚠️ Agent not found, skipping push");
    } else {
      const agentData = agentSnap.data();

      // Support BOTH naming styles
      const pushToken = agentData.fcmToken || agentData.pushToken || null;

      // 4️⃣ Send push notification safely
      if (pushToken) {
        try {
          await sendPushNotification(pushToken, {
            title: "New Client Request 🚨",
            body: `${clientName || "A client"} needs a ${propertyType}`,
            data: {
              requestId: String(docRef.id),
              lat: String(latitude),
              lng: String(longitude),
              type: "NEW_BOOKING_REQUEST",
            },
          });

          console.log("📨 Push sent to agent");
        } catch (pushError) {
          console.error("⚠️ Push failed:", pushError.message);
        }
      } else {
        console.log("⚠️ No push token found for agent");
      }
    }

    // 5️⃣ Send success response
    res.status(201).json({
      success: true,
      requestId: docRef.id,
    });

  } catch (error) {
    console.error("❌ Controller Error:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
};
