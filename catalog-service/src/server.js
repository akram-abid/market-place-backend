import express from "express";
import dotenv from "dotenv";
import productsRoutes from "./modules/products/products.route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/products", productsRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`catalog-service running on http://localhost:${PORT}`);
});