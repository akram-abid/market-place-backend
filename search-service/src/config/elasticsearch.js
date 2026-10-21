import { Client } from "@elastic/elasticsearch"

export const esClient = new Client({ node: "http://localhost:9200" })

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