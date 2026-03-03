import { db } from "../config/firebase.js";
import { sendPushNotification } from "../utils/push.js";

export const clinetRequest = async (req, res) => {
  try {
    const { requestId, agentId, clientId, clientName, propertyType, lat, lng } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Missing requestId" });
    }

    if (!agentId || !clientId || !propertyType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const docRef = db.collection("agent_requests").doc(requestId);

    await docRef.set({
      requestId,
      agentId,
      clientId,
      clientName,
      propertyType,
      lat,
      lng,
      status: "pending",
      updatedAt: Date.now(),
    }, { merge: true });

    const agentSnap = await db.collection("agents").doc(agentId).get();
    const agentData = agentSnap.data();

    if (agentData) {
      await sendPushNotification(agentData, {
        title: "New Client 🚨",
        body: `${clientName} needs a ${propertyType}`,
        data: {
          requestId,
          agentId: agentId.toString(),
          clientId: clientId.toString(),
          clientName: clientName || "",
          propertyType: propertyType || "",
          lat: lat?.toString() || "",
          lng: lng?.toString() || "",
        },
      });
    }

    res.status(200).json({
      success: true,
      requestId,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request" });
  }
};
