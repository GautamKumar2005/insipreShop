export interface IDeliveryProfile {
  _id: string;
  user: string; // User ID
  currentLocation: {
    lat: number;
    lng: number;
  };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDeliveryTask {
  _id: string;
  order: string; // Order ID
  delivery?: string; // DeliveryProfile ID
  pickupLocation: string;
  dropLocation: string;
  status: "WAITING" | "ASSIGNED" | "IN_TRANSIT" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}
