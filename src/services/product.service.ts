import Product from "@/models/Product";

/* =========================
   CREATE PRODUCT
========================= */
export async function createProduct(sellerId: string, data: any) {
  return Product.create({
    seller: sellerId,
    ...data,
  });
}

/* =========================
   GET ALL PRODUCTS (ADMIN)
========================= */
export async function getProducts() {
  return Product.find().populate("seller");
}

/* =========================
   GET PRODUCT BY ID
========================= */
export async function getProductById(id: string) {
  return Product.findById(id).populate("seller");
}

/* =========================
   UPDATE PRODUCT
========================= */
export async function updateProduct(id: string, data: any) {
  return Product.findByIdAndUpdate(id, data, { new: true });
}

/* =========================
   DELETE PRODUCT
========================= */
export async function deleteProduct(id: string) {
  return Product.findByIdAndDelete(id);
}

/* =========================
   🔍 SEARCH + FILTER PRODUCTS
========================= */
export async function searchProducts(query: any) {
  const {
    q,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    sort = "newest",
    category,
  } = query;

  const filter: any = {
    isActive: true,
  };

  /* 🔍 TEXT SEARCH */
  if (q) {
    filter.$text = { $search: q };
  }

  /* 💰 PRICE FILTER */
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  /* 🏷️ CATEGORY FILTER */
  if (category) {
    filter.category = category;
  }

  /* ↕ SORTING */
  let sortQuery: any = { createdAt: -1 };

  if (sort === "price_asc") sortQuery = { price: 1 };
  if (sort === "price_desc") sortQuery = { price: -1 };
  if (q) sortQuery = { score: { $meta: "textScore" } };

  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(Number(limit))
    .populate("seller");

  const total = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  };
}
