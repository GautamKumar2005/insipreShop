export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "buyer" | "seller" | "delivery" | "admin";
  profilePhoto?: {
    publicId: string;
    url: string;
  };
  dob?: Date;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
