import express from "express";
import dotenv from "dotenv";
import ordersRoutes from "./modules/orders/orders.route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/orders", ordersRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`order-service running on http://localhost:${PORT}`);
});