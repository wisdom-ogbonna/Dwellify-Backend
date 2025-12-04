import express from "express";
import multer from "multer";
import { addRentalProduct,deleteRentalProduct,getAllRentalProducts, getRentalProductById, updateRentalProduct } from "../controllers/productController.js";

import { verifyFirebaseToken } from "../middlewares/auth.js";
const router = express.Router();
const storage = multer.memoryStorage(); // store uploaded files in memory
const upload = multer({ storage });

// Accept one image and one video
router.post(
  "/add-rental-product",
  verifyFirebaseToken,
  upload.fields([
    { name: "images", maxCount: 10 },  // multiple images
    { name: "image", maxCount: 1 }     // optional single image
  ]),
  addRentalProduct
);



// ✅ Get all rental products
router.get("/get-rental-products", verifyFirebaseToken,getAllRentalProducts);
router.get("/get-rental-product/:id", verifyFirebaseToken,getRentalProductById); // 👈 NEW

router.put(
  "/update-rental-product/:id",
  verifyFirebaseToken,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "image", maxCount: 1 },
  ]),
  updateRentalProduct
);

// DELETE
router.delete("/delete-rental-product/:id", verifyFirebaseToken,deleteRentalProduct);

export default router;
