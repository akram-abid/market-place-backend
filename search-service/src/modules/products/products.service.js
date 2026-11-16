import { searchProducts } from "../../config/elasticsearch.js";

export async function searchProductsForQuery({
  query,
  categoryId,
  minPrice,
  maxPrice,
  limit,
  offset,
}) {
  return searchProducts({
    query,
    categoryId,
    minPrice,
    maxPrice,
    limit,
    offset,
  });
}
