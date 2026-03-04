import { db } from "../config/firebase.js";

// ✅ Get all agents
export const getAllAgents = async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "agent")
      .get();

    const agents = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(agents);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch agents",
      details: error.message,
    });
  }
};


// ✅ Get all clients
export const getAllClients = async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "client")
      .get();

    const clients = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(clients);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch clients",
      details: error.message,
    });
  }
};