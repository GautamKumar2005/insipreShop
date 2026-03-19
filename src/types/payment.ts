export interface IPaymentOrder {
  orderId: string; // Order ID
  amount: number;
  currency: string;
}

export interface IPaymentVerification {
  orderId: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
}
