import express from "express";
import { pool } from "./config/db.js";

const app = express();

app.get("/health", (req, res, next) => {
  res.json({ status: "ok" });
});

app.get("/db-check", async (req, res, next) => {
  try {
    const result = await pool.query("select now()");
    res.json({ dbtime: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
