import User from "@/models/User";

export async function getAllUsers() {
  return User.find().select("-password");
}

export async function getUserById(id: string) {
  return User.findById(id).select("-password");
}

export async function updateUser(id: string, data: any) {
  return User.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteUser(id: string) {
  return User.findByIdAndDelete(id);
}
