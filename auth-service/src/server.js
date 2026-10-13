import express from "express";
import dotenv from "dotenv";
import authRoutes from "./modules/auth.routes.js";

dotenv.config();
const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`auth-service running on http://localhost:${PORT}`);
});
