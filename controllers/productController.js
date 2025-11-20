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

export const addRentalProduct = async (req, res) => {
  try {
    const { title, location, price, Apartment, Hotel, Shortlet } = req.body;

    if (!title || !location || !price) {
      return res
        .status(400)
        .json({ error: "Title, location, and price are required" });
    }

    const images = [];
    let video = "";

    // Handle single image
    if (req.files.image && req.files.image[0]) {
      const imageUrl = await uploadFileToFirebase(req.files.image[0]);
      images.push(imageUrl);
    }

    // Handle single video
    if (req.files.video && req.files.video[0]) {
      video = await uploadFileToFirebase(req.files.video[0]);
    }

    const newProduct = {
      title,
      location,
      price,
      Apartment: Apartment === "true",
      Hotel: Hotel === "true",
      Shortlet: Shortlet === "true",
      images,
      video,
      created_at: new Date(),
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


export const getAllRentalProducts = async (req, res) => {
  try {
    const snapshot = await db.collection("rentalProducts").orderBy("created_at", "desc").get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No rental products found" });
    }

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

