import { db, bucket } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

// Helper to upload a file to Firebase Storage
const uploadFileToFirebase = async (file) => {
  const fileName = `${uuidv4()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: { contentType: file.mimetype },
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (err) => reject(err));
    blobStream.on("finish", async () => {
      await fileUpload.makePublic();
      resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
    });
    blobStream.end(file.buffer);
  });
};

// ===================== ADD PRODUCT =====================
export const addRentalProduct = async (req, res) => {
  try {
    const { title, location, price, propertyType } = req.body;

    if (!title || !location || !price || !propertyType) {
      return res.status(400).json({
        error: "Title, location, price and propertyType are required",
      });
    }

    if (!["Apartment", "Hotel", "Shortlet"].includes(propertyType)) {
      return res.status(400).json({ error: "Invalid property type" });
    }

    const images = [];

    if (req.files?.images) {
      for (const img of req.files.images) {
        const url = await uploadFileToFirebase(img);
        images.push(url);
      }
    }

    if (req.files?.image?.[0]) {
      const url = await uploadFileToFirebase(req.files.image[0]);
      images.push(url);
    }

    const newProduct = {
      title,
      location,
      price,
      propertyType, // 🔥 IMPORTANT
      images,
      created_at: new Date(),
      agentId: req.user.uid,
    };

    const docRef = await db.collection("rentalProducts").add(newProduct);

    return res.status(201).json({
      message: "Rental product added successfully",
      id: docRef.id,
      data: newProduct,
    });
  } catch (error) {
    console.error("Error adding rental product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ===================== GET ALL PRODUCTS (USER ONLY) =====================
export const getAllRentalProducts = async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized. Missing token." });
    }

    const snapshot = await db
      .collection("rentalProducts")
      .where("agentId", "==", req.user.uid)
      .orderBy("created_at", "desc")
      .get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching rental products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ===================== GET PRODUCT BY ID =====================
export const getRentalProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const productRef = db.collection("rentalProducts").doc(id);
    const doc = await productRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const data = doc.data();

    // Ownership check
    if (data.agentId !== req.user.uid) {
      return res.status(403).json({ error: "You cannot view this product" });
    }

    return res.status(200).json({ id: doc.id, ...data });
  } catch (error) {
    console.error("Error fetching rental product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ===================== UPDATE PRODUCT =====================
export const updateRentalProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productRef = db.collection("rentalProducts").doc(id);
    const doc = await productRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const oldData = doc.data();

    // Ownership check
    if (oldData.agentId !== req.user.uid) {
      return res.status(403).json({ error: "You cannot update this product" });
    }

    let updatedImages = oldData.images || [];

    if (req.files && (req.files.images || req.files.image)) {
      // Delete previous images
      for (const url of updatedImages) {
        const fileName = url.split("/").pop();
        await bucket
          .file(fileName)
          .delete()
          .catch(() => {});
      }

      updatedImages = [];

      if (req.files.images) {
        for (const img of req.files.images) {
          const url = await uploadFileToFirebase(img);
          updatedImages.push(url);
        }
      }

      if (req.files.image && req.files.image[0]) {
        const url = await uploadFileToFirebase(req.files.image[0]);
        updatedImages.push(url);
      }
    }

    const updatedData = {
      ...oldData,
      ...req.body,
      Apartment: req.body.Apartment === "true",
      Hotel: req.body.Hotel === "true",
      Shortlet: req.body.Shortlet === "true",
      images: updatedImages,
      updated_at: new Date(),
    };

    await productRef.update(updatedData);

    return res.status(200).json({
      message: "Rental product updated successfully",
      id,
      data: updatedData,
    });
  } catch (error) {
    console.error("Error updating rental product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ===================== DELETE PRODUCT =====================
export const deleteRentalProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productRef = db.collection("rentalProducts").doc(id);
    const doc = await productRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const data = doc.data();

    // Ownership check
    if (data.agentId !== req.user.uid) {
      return res.status(403).json({ error: "You cannot delete this product" });
    }

    if (data.images && data.images.length > 0) {
      for (const url of data.images) {
        const fileName = url.split("/").pop();
        await bucket
          .file(fileName)
          .delete()
          .catch(() => {});
      }
    }

    await productRef.delete();

    return res
      .status(200)
      .json({ message: "Rental product deleted successfully", id });
  } catch (error) {
    console.error("Error deleting rental product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
