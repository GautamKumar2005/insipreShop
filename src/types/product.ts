export interface IProduct {
  _id: string;
  seller: string; // SellerProfile ID
  name: string;
  description?: string;
  price: number;
  stock: number;
  rating?: number;
  images: {
    publicId: string;
    url: string;
  }[];
  createdAt: string;
  updatedAt: string;
  views?: number;
  likes?: number;
  shares?: number;
}

export type Product = IProduct;
