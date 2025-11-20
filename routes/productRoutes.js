import express from "express";
import multer from "multer";
import { addRentalProduct,getAllRentalProducts } from "../controllers/productController.js";

const router = express.Router();
const storage = multer.memoryStorage(); // store uploaded files in memory
const upload = multer({ storage });

// Accept one image and one video
router.post(
  "/add-rental-product",
  upload.fields([
    { name: "image", maxCount: 1 }, // single image
    { name: "video", maxCount: 1 }, // single video
  ]),
  addRentalProduct
);


// ✅ Get all rental products
router.get("/get-rental-products", getAllRentalProducts);

export default router;
