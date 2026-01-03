import { db } from "../config/firebase.js";

/**
 * ===============================
 * GET PRODUCTS BY AGENT (PUBLIC)
 * ===============================
 * Clients can view agent listings
 */
export const getProductsByAgentId = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { propertyType } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: "agentId is required" });
    }

    let query = db
      .collection("rentalProducts")
      .where("agentId", "==", agentId);

    // Optional filter (Hotel, Apartment, Shortlet)
    if (propertyType) {
      query = query.where("propertyType", "==", propertyType);
    }

    const snapshot = await query.orderBy("created_at", "desc").get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching agent products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
