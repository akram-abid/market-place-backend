import express from "express";
import dotenv from "dotenv";
import { createProductsIndex } from "./config/elasticsearch.js";
import { startConsumer } from "./config/rabbitmq.js";
import productsRoutes from "./modules/products/products.route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/products", productsRoutes);
const PORT = process.env.PORT || 3004;

async function startServer() {
  await createProductsIndex();
  await startConsumer();
  app.listen(PORT, () => {
    console.log(`search-service running on http://localhost:${PORT}`);
  });
}

startServer();
