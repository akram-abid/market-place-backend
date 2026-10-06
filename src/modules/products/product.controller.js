import {
  findProductById,
  listProducts,
} from "../../db/queries/products.queries.js";
import {
  createProductForSeller,
  deleteProductForSeller,
  updateProductForSeller,
} from "./product.service.js";

export async function listProductController(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const products = await listProducts({ limit, offset });
    return res.status(200).json({ products });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "something went wrong!" });
  }
}

export async function getProductController(req, res) {
  try {
    const productId = req.params.id;

    const product = await findProductById(productId);

    if (!productId || !product) {
      return res.status(404).json({ error: "no product found" });
    }

    return res.status(200).json({ product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function createProductController(req, res) {
  try {
    const sellerId = req.user.id;
    const { categoryId, name, description, priceCents, stockQuantity } =
      req.body;
    const result = await createProductForSeller({
      sellerId,
      categoryId,
      name,
      description,
      priceCents,
      stockQuantity,
    });

    return res.status(201).json({ product: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function updateProductController(req, res) {
  try {
    const productId = req.params.id;
    const sellerId = req.user.id;
    
    const { name, description, categoryId, priceCents, stockQuantity } =
      req.body;
    console.log("the price i got ", priceCents)

    const result = await updateProductForSeller({
      sellerId,
      productId,
      categoryId,
      name,
      description,
      priceCents,
      stockQuantity,
    });
    console.log("after updating ", result)
    return res.status(200).json({ product: result });
  } catch (err) {
    if (err.message === "NO_PRODUCT_FOUND") {
      return res.status(404).json({ error: "product not found" });
    }

    if (err.message === "NOT_PRODUCT_OWNER") {
      return res.status(403).json({ error: "you dont own the product to update it" });
    }
    console.error(err);
    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function deleteProductController(req, res) {
  try {
    const productId = req.params.id;
    const sellerId = req.user.id;

    const result = await deleteProductForSeller({ sellerId, productId });

    return res.status(200).json({message: "deleted"})
  } catch (err) {
    if (err.message === "NO_PRODUCT_FOUND") {
      return res.status(404).json({ error: "product not found" });
    }

    if (err.message === "NOT_PRODUCT_OWENR") {
      return res.status(403).json({ error: "you dont own the product to delete it" });
    }
    console.error(err);
    return res.status(500).json({ error: "something went wrong" });
  }
}
