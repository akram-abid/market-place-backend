import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});
export const PRODUCTS_INDEX = "products";

export async function createProductsIndex() {
  const exists = await esClient.indices.exists({ index: PRODUCTS_INDEX });

  if (exists) {
    console.log("Products index already exists");
    return;
  }

  await esClient.indices.create({
    index: PRODUCTS_INDEX,
    mappings: {
      properties: {
        name: {
          type: "text",
          fields: {
            keyword: { type: "keyword" },
          },
        },
        description: { type: "text" },
        priceCents: { type: "integer" },
        categoryId: { type: "keyword" },
        sellerId: { type: "keyword" },
      },
    },
  });

  console.log("Products index created");
}

export async function indexProduct(product) {
  await esClient.index({
    index: PRODUCTS_INDEX,
    id: product.id,
    document: {
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      categoryId: product.categoryId,
      sellerId: product.sellerId,
    },
  });
}

export async function deleteProductFromIndex(productId) {
  await esClient.delete({
    index: PRODUCTS_INDEX,
    id: productId,
  });
}

export async function searchProducts({
  query,
  categoryId,
  minPrice,
  maxPrice,
  limit = 20,
  offset = 0,
}) {
  const mustClauses = [];
  const filterClauses = [];

  if (query) {
    mustClauses.push({ match: { name: query } });
  }

  if (categoryId) {
    filterClauses.push({ term: { categoryId } });
  }

  if (minPrice != null || maxPrice != null) {
    const range = {};
    if (minPrice != null) range.gte = minPrice;
    if (maxPrice != null) range.lte = maxPrice;
    filterClauses.push({ range: { priceCents: range } });
  }

  const result = await esClient.search({
    index: PRODUCTS_INDEX,
    query: {
      bool: {
        must: mustClauses.length ? mustClauses : [{ match_all: {} }],
        filter: filterClauses,
      },
    },
    from: offset,
    size: limit,
  });

  return result.hits.hits.map((hit) => ({ id: hit._id, ...hit._source }));
}
