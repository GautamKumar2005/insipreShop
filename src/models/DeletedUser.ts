import mongoose, { Schema, Document } from "mongoose";

export interface IDeletedUser extends Document {
  originalUserId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: Date;
  deletedAt: Date;
  deletedBy: string;
  archivedData: {
    productsCount: number;
    socialPostsCount: number;
    reviewsCount: number;
    commentsCount: number;
    profile: any;
  };
}

const DeletedUserSchema = new Schema<IDeletedUser>({
  originalUserId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  role: { type: String, required: true },
  createdAt: { type: Date, required: true },
  deletedAt: { type: Date, default: Date.now },
  deletedBy: { type: String, required: true },
  archivedData: {
    productsCount: { type: Number, default: 0 },
    socialPostsCount: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    profile: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

DeletedUserSchema.index({ email: 1 });
DeletedUserSchema.index({ deletedAt: -1 });

export default mongoose.models.DeletedUser ||
  mongoose.model<IDeletedUser>("DeletedUser", DeletedUserSchema);
