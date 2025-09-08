import express from "express";
import "dotenv/config";
import otpRoutes from "./routes/otpRoutes.js";


const app = express();

app.use(express.json());

app.use("/api/otp", otpRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
