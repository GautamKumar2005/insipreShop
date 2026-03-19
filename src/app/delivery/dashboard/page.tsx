"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Task {
  _id: string;
  order: {
    _id: string;
    totalAmount: number;
    deliveryAddress: string;
    buyer: { _id: string; name: string; phone?: string };
    seller: { _id: string; name: string; address?: string };
    items: any[];
  };
  pickupLocation: string;
  dropLocation: string;
  status: string; // WAITING, ASSIGNED, IN_TRANSIT, COMPLETED
}

export default function DeliveryDashboardPage() {
  const { getAuthHeaders, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my">("available");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      if (user.role !== "delivery") {
        router.push("/");
        return;
      }
      fetchTasks();
    }
  }, [user, authLoading]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch Available
      const resAvailable = await fetch("/api/delivery/tasks?type=available", {
        headers,
      });
      const dataAvailable = await resAvailable.json();
      if (dataAvailable.success) setAvailableTasks(dataAvailable.data);

      // Fetch Assigned
      const resAssigned = await fetch("/api/delivery/tasks?type=assigned", {
        headers,
      });
      const dataAssigned = await resAssigned.json();
      if (dataAssigned.success) setMyTasks(dataAssigned.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/delivery/accept", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
        setActiveTab("my");
      } else {
        alert(data.message || "Failed to accept task");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (
    taskId: string,
    status: "PICKED" | "DELIVERED",
  ) => {
    try {
      const res = await fetch("/api/delivery/status", {
        method: "POST", // or PATCH
        headers: getAuthHeaders(),
        body: JSON.stringify({ taskId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startChat = async (participantId: string, orderId: string) => {
    try {
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantId, orderId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/chat/${data.data._id}`);
      } else {
        console.error("Chat error", data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Delivery Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 ${activeTab === "available" ? "border-b-2 border-black font-bold" : "text-gray-500"}`}
          onClick={() => setActiveTab("available")}
        >
          Available Tasks ({availableTasks.length})
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === "my" ? "border-b-2 border-black font-bold" : "text-gray-500"}`}
          onClick={() => setActiveTab("my")}
        >
          My Deliveries (
          {myTasks.filter((t) => t.status !== "COMPLETED").length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "available" ? (
          availableTasks.length === 0 ? (
            <p className="text-gray-500">No tasks available nearby.</p>
          ) : (
            availableTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onAction={() => acceptTask(task._id)}
                actionLabel="Accept"
              />
            ))
          )
        ) : myTasks.length === 0 ? (
          <p className="text-gray-500">No tasks assigned to you.</p>
        ) : (
          myTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isMyTask
              onStatusUpdate={updateStatus}
              onChat={startChat}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onAction,
  actionLabel,
  isMyTask,
  onStatusUpdate,
  onChat,
}: any) {
  const isCompleted = task.status === "COMPLETED";

  return (
    <div
      className={`border rounded-lg p-5 shadow-sm bg-white ${isCompleted ? "opacity-60" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded font-bold ${getStatusColor(task.status)}`}
            >
              {task.status}
            </span>
            <span className="text-sm text-gray-500">
              #{task.order?._id.slice(-6)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500 uppercase">Pickup From</p>
              <p className="font-medium">{task.pickupLocation}</p>
              <p className="text-sm text-gray-600">
                {task.order?.seller?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Drop To</p>
              <p className="font-medium">{task.dropLocation}</p>
              <p className="text-sm text-gray-600">{task.order?.buyer?.name}</p>
            </div>
          </div>

          <div className="mt-3 text-sm">
            <span className="font-semibold">Total:</span> ₹
            {task.order?.totalAmount}
          </div>

          {/* Product Items Display */}
          {task.order?.items && task.order.items.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Items to Deliver
              </p>
              {task.order.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">
                      {item.product?.name || "Unknown Product"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isMyTask && !isCompleted && (
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => onChat(task.order.buyer._id, task.order._id)}
                variant="outline"
                className="text-xs px-3 py-1 h-8"
              >
                💬 Chat w/ Buyer
              </Button>
              <Button
                onClick={() => onChat(task.order.seller._id, task.order._id)}
                variant="outline"
                className="text-xs px-3 py-1 h-8"
              >
                💬 Chat w/ Seller
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {!isMyTask && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}

          {isMyTask && !isCompleted && onStatusUpdate && (
            <>
              {task.status === "ASSIGNED" && (
                <Button onClick={() => onStatusUpdate(task._id, "PICKED")}>
                  Mark Picked Up
                </Button>
              )}
              {task.status === "IN_TRANSIT" && (
                <Button onClick={() => onStatusUpdate(task._id, "DELIVERED")}>
                  Mark Delivered
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "WAITING":
      return "bg-yellow-100 text-yellow-800";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800";
    case "IN_TRANSIT":
      return "bg-purple-100 text-purple-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
