import { searchProductsForQuery } from "./products.service.js";

export async function searchProductsController(req, res) {
  try {
    const { q, categoryId, minPrice, maxPrice, limit, offset } = req.query;

    const results = await searchProductsForQuery({
      query: q,
      categoryId,
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "something went wrong" });
  }
}