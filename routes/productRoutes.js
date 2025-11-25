import express from "express";
import multer from "multer";
import { addRentalProduct,deleteRentalProduct,getAllRentalProducts, updateRentalProduct } from "../controllers/productController.js";

const router = express.Router();
const storage = multer.memoryStorage(); // store uploaded files in memory
const upload = multer({ storage });

// Accept one image and one video
router.post(
  "/add-rental-product",
  upload.fields([
    { name: "images", maxCount: 10 },  // multiple images
    { name: "image", maxCount: 1 }     // optional single image
  ]),
  addRentalProduct
);



// ✅ Get all rental products
router.get("/get-rental-products", getAllRentalProducts);

router.put(
  "/update-rental-product/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "image", maxCount: 1 },
  ]),
  updateRentalProduct
);

// DELETE
router.delete("/delete-rental-product/:id", deleteRentalProduct);

export default router;
