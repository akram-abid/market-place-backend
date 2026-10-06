import {
  createProduct,
  findProductById,
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
  console.log("the product i got is this ", product);
  if (!product || product.deleted_at != null) {
    throw new Error("NOT_PRODUCT_OWNER");
  }

  if (sellerId != product.seller_id) {
    throw new Error("NOT_PRODUCT_OWNER");
  }
  console.log("the product i am searching for is this ", productId)
  const updatedProduct = await updateProduct({
    id: productId,
    categoryId,
    name,
    description,
    priceCents,
    stockQuantity,
  });
  console.log("i have updated i guess ", updatedProduct )
  return updatedProduct;
}

export async function deleteProductForSeller({ productId, sellerId }) {
  const product = await findProductById(productId);
  console.log("the product i got is this ", product);
  if (!product || product.deleted_at != null) {
    throw new Error("NO_PRODUCT_FOUND");
  }

  if (sellerId != product.seller_id) {
    throw new Error("NOT_PRODUCT_OWNER");
  }

  const result = await softDeleteProduct(productId);
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

  return product;
}
