import {
  createProduct,
  findProductById,
  softDeleteProduct,
  updateProduct,
} from "../../db/queries/products.qureies.js";

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
    throw new Error("NO_PRODUCT_FOUND");
  }

  if (sellerId != product.seller_id) {
    throw new Error("NOT_PRODUCT_OWNER");
  }

  const updatedProduct = await updateProduct({
    productId,
    categoryId,
    name,
    description,
    priceCents,
    stockQuantity,
  });
  return updateProduct;
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
