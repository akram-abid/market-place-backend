import express from "express";
import dotenv from "dotenv";
import { createProductsIndex } from "./config/elasticsearch.js";
import { startConsumer } from "./config/rabbitmq.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3004;

async function startServer() {
  await createProductsIndex();
  await startConsumer()
  app.listen(PORT, () => {
    console.log(`search-service running on http://localhost:${PORT}`);
  });
}

startServer();