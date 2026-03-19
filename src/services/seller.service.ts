import SellerProfile from "@/models/SellerProfile";

export async function applySeller(userId: string, data: any) {
  return SellerProfile.create({
    user: userId,
    ...data,
  });
}

export async function approveSeller(sellerId: string) {
  return SellerProfile.findByIdAndUpdate(
    sellerId,
    { isApproved: true },
    { new: true }
  );
}

export async function getSellers() {
  return SellerProfile.find().populate("user");
}
