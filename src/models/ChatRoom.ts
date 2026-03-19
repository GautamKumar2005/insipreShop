import mongoose, { Schema, Document } from "mongoose";

export interface IChatRoom extends Document {
  order: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: false },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.models.ChatRoom ||
  mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema);
