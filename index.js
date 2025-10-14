import express from "express";
import "dotenv/config";
import otpRoutes from "./routes/otpRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";


const app = express();

app.use(express.json());

app.use("/api/otp", otpRoutes);
app.use("/api/role", roleRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
