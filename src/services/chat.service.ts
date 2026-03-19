import DeliveryProfile from "@/models/DeliveryProfile";
import DeliveryTask from "@/models/DeliveryTask";

export async function applyDelivery(userId: string) {
  return DeliveryProfile.create({ user: userId });
}

export async function updateLocation(userId: string, location: any) {
  return DeliveryProfile.findOneAndUpdate(
    { user: userId },
    { currentLocation: location },
    { new: true }
  );
}

export async function assignDelivery(orderId: string) {
  const delivery = await DeliveryProfile.findOne({ isAvailable: true });
  if (!delivery) throw new Error("No delivery available");

  delivery.isAvailable = false;
  await delivery.save();

  return DeliveryTask.create({
    order: orderId,
    delivery: delivery._id,
    status: "ASSIGNED",
  });
}
