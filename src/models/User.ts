import mongoose, { Schema, Document } from "mongoose";
import { encryptField, decryptField } from "@/utils/encryption";

export interface IUser extends Document {
  name: string;
  username: string; // New: Unique username like Instagram
  bio?: string;     // New: User bio
  email: string;
  phone: string;
  password: string;
  role: "buyer" | "seller" | "delivery" | "admin";
  profilePhoto?: {
    publicId: string;
    url: string;
  };
  dob?: Date;
  address?: string;
  theme?: "light" | "dark" | "system";
  lastSeen?: Date;
  isOnline?: boolean;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true }, // Sparse because existing users won't have it yet
    bio: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { 
      type: String, 
      required: true,
      get: decryptField,
      set: encryptField
    },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["buyer", "seller", "delivery", "admin"],
      default: "buyer",
    },

    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },

    profilePhoto: {
      publicId: String,
      url: String,
    },

    dob: Date,
    address: { 
      type: String,
      get: decryptField,
      set: encryptField
    },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
