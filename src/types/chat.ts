export interface IChatRoom {
  _id: string;
  order: string; // Order ID
  participants: string[]; // User IDs
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  chatRoom: string; // ChatRoom ID
  sender: string; // User ID
  message: string;
  createdAt: string;
  updatedAt: string;
}
