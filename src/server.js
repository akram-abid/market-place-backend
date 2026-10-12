import express from "express";
import { pool } from "./config/db.js";
import { createUser, findUserByEmail } from "./db/queries/users.queries.js";
import authRoutes from "./modules/auth/auth.routes.js";
import productsRoutes from "./modules/products/products.route.js"
import orderRoutes from "./modules/orders/orders.route.js"
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/products", productsRoutes)
app.use("/orders", orderRoutes)

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
