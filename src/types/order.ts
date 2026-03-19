export interface IOrderItem {
  product: string; // Product ID
  quantity: number;
  price: number;
}

export interface IOrder {
  _id: string;
  buyer: string; // User ID
  seller: string; // SellerProfile ID
  delivery?: string; // DeliveryProfile ID
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  status:
    | "PLACED"
    | "PAID"
    | "CONFIRMED"
    | "PICKED_UP"
    | "DELIVERED"
    | "CANCELLED";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt: string;
}
