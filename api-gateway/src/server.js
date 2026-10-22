import express from "express";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();

app.use(
  createProxyMiddleware({
    pathFilter: "/auth",
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: "/products/search",
    target: process.env.SEARCH_SERVICE_URL,
    changeOrigin: true,
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: "/products",
    target: process.env.CATALOG_SERVICE_URL,
    changeOrigin: true,
  }),
);

app.use(
  createProxyMiddleware({
    pathFilter: "/orders",
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
  }),
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`api-gateway running on http://localhost:${PORT}`);
});
