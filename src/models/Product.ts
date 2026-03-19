import mongoose, { Schema, Document } from "mongoose";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  isActive: boolean;
  isEdited?: boolean;
  rating: number;
  images: {
    publicId: string;
    url: string;
  }[];
}

const ProductSchema = new Schema<IProduct>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User", // ✅ link to User collection
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      index: true,
      // Optional now
    },

    images: [
      {
        publicId: { type: String },
        url: { type: String },
      },
    ], // Added images back to schema

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 4.0,
      min: 1,
      max: 5,
    },

  },
  { timestamps: true }
);

// Add static method interface
 interface IProductModel extends mongoose.Model<IProduct> {
  searchProducts(params: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
  }): Promise<IProduct[]>;
}

/* 🔍 TEXT SEARCH */
ProductSchema.index({
  name: "text",
  description: "text",
});

/* 💰 PRICE FILTER */
ProductSchema.index({ price: 1 }); // ✅ keep this, remove inline index in price field

// Static method for searching products
ProductSchema.statics.searchProducts = async function (params: {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  const { search, category, minPrice, maxPrice } = params;

  const query: any = {
    isActive: true, // Only show active products
    stock: { $gt: 0 }, // Only show products in stock
  };

  // Text search by name, description, or category
  if (search) {
    const searchTerms = search.trim().split(/\s+/);
    if (searchTerms.length > 0) {
      query.$and = searchTerms.map((term) => ({
        $or: [
          { name: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
          { category: { $regex: term, $options: "i" } },
        ],
      }));
    }
  }

  // Category filter
  if (category && category !== "All") {
    query.category = category;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);

    // If neither minPrice nor maxPrice is provided (invalid numbers), remove the filter
    if (Object.keys(query.price).length === 0) {
      delete query.price;
    }
  }

  return this.find(query)
    .populate("seller", "name email")
    .sort({ createdAt: -1 });
};

const Product =
  (mongoose.models.Product as IProductModel) ||
  mongoose.model<IProduct, IProductModel>("Product", ProductSchema);

export default Product;
