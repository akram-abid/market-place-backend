import { createDiffieHellmanGroup } from "crypto";
import { pool } from "../../config/db.js";
import { publishProductEvent } from "../../config/rabbitmq.js";
import {
  createProduct,
  decrementStock,
  findProductById,
  lockProductForUpdate,
  softDeleteProduct,
  updateProduct,
} from "../../db/queries/products.queries.js";

export async function updateProductForSeller({
  sellerId,
  productId,
  categoryId,
  name,
  description,
  priceCents,
  stockQuantity,
}) {
  const product = await findProductById(productId);
  if (!product || product.deleted_at != null) {
    throw new Error("NO_PRODUCT_FOUND");
  }

  if (sellerId != product.seller_id) {
    throw new Error("NOT_PRODUCT_OWNER");
  }
  const updatedProduct = await updateProduct({
    id: productId,
    categoryId,
    name,
    description,
    priceCents,
    stockQuantity,
  });

  try {
    await publishProductEvent({
      type: "product.updated",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        priceCents: updatedProduct.price_cents,
        categoryId: updatedProduct.category_id,
        sellerId: updatedProduct.seller_id,
      },
    });
  } catch (error) {
    console.error(error);
  }

  return updatedProduct;
}

export async function deleteProductForSeller({ productId, sellerId }) {
  const product = await findProductById(productId);
  if (!product || product.deleted_at != null) {
    throw new Error("NO_PRODUCT_FOUND");
  }

  if (sellerId != product.seller_id) {
    throw new Error("NOT_PRODUCT_OWNER");
  }

  const result = await softDeleteProduct(productId);
  try {
    await publishProductEvent({
      type: "product.deleted",
      product: {
        id: result.id,
        name: result.name,
        description: result.description,
        priceCents: result.price_cents,
        categoryId: result.category_id,
        sellerId: result.seller_id,
      },
    });
  } catch (error) {
    console.error(error);
  }
  return result;
}

export async function createProductForSeller({
  sellerId,
  categoryId,
  name,
  description,
  priceCents,
  stockQuantity,
}) {
  const product = await createProduct({
    sellerId,
    categoryId,
    name,
    description,
    priceCents,
    stockQuantity,
  });

  try {
    await publishProductEvent({
      type: "product.created",
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        priceCents: product.price_cents,
        categoryId: product.category_id,
        sellerId: product.seller_id,
      },
    });
  } catch (error) {
    console.error(error);
  }
  return product;
}

export async function reserveStock({ items, buyerId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reservedItems = [];

    for (const item of items) {
      const product = await lockProductForUpdate(client, item.productId);

      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.seller_id === buyerId)
        throw new Error("CANNOT_BUY_OWN_PRODUCT");
      if (product.stock_quantity < item.quantity)
        throw new Error("INSUFFICIENT_STOCK");

      await decrementStock(client, item.productId, item.quantity);

      reservedItems.push({
        productId: product.id,
        name: product.name,
        priceCents: product.price_cents,
        quantity: item.quantity,
      });
    }

    await client.query("COMMIT");
    return reservedItems;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
