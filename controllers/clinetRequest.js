import { db } from "../config/firebase.js";
import { sendPushNotification } from "../utils/push.js";

export const clinetRequest = async (req, res) => {
  try {
    const clientId = req.user.uid;
    const { requestId, agentId, propertyType, lat, lng } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: "Missing requestId" });
    }

    if (!agentId || !clientId || !propertyType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Get client (trusted)
    const clientSnap = await db.collection("users").doc(clientId).get();

    if (!clientSnap.exists) {
      return res.status(404).json({ error: "Client not found" });
    }

    const clientData = clientSnap.data();

    const clientName =
      clientData.clientDetails?.name ||
      clientData.name ||
      "Unknown";

    // ✅ Save request
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

    // ✅ Get agent
    const agentSnap = await db.collection("agents").doc(agentId).get();

    if (!agentSnap.exists) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const agentData = agentSnap.data();

    // ✅ Send notification
    await sendPushNotification(agentData, {
      title: "New Client 🚨",
      body: `${clientName} needs a ${propertyType}`,
      data: {
        requestId,
        agentId: agentId.toString(),
        clientId: clientId.toString(),
        clientName,
        propertyType,
        lat: lat?.toString() || "",
        lng: lng?.toString() || "",
      },
    });

    res.status(200).json({
      success: true,
      requestId,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process request" });
  }
};