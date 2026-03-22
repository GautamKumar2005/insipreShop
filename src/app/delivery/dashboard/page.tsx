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
              }
    } catch (err) {
          }
  };

  if (authLoading || loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Delivery Dashboard</h1>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex overflow-x-auto no-scrollbar space-x-2 sm:space-x-4 mb-6 border-b -mx-6 px-6">
        <button
          className={`pb-2 px-4 whitespace-nowrap text-sm sm:text-base transition-all ${activeTab === "available" ? "border-b-2 border-black font-black text-black" : "text-gray-400 font-medium"}`}
          onClick={() => setActiveTab("available")}
        >
          Available Tasks ({availableTasks.length})
        </button>
        <button
          className={`pb-2 px-4 whitespace-nowrap text-sm sm:text-base transition-all ${activeTab === "my" ? "border-b-2 border-black font-black text-black" : "text-gray-400 font-medium"}`}
          onClick={() => setActiveTab("my")}
        >
          My Deliveries ({myTasks.filter((t) => t.status !== "COMPLETED").length})
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
      className={`border rounded-2xl p-4 md:p-6 shadow-sm bg-white hover:shadow-md transition-all ${isCompleted ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider ${getStatusColor(task.status)}`}
            >
              {task.status}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              #{task.order?._id.slice(-6)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Pickup From</p>
              <p className="font-bold text-gray-800 leading-tight mb-1">{task.pickupLocation}</p>
              <p className="text-xs text-indigo-600 font-medium bg-indigo-50 w-fit px-2 py-0.5 rounded-full">
                {task.order?.seller?.name}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Drop To</p>
              <p className="font-bold text-gray-800 leading-tight mb-1">{task.dropLocation}</p>
              <p className="text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-0.5 rounded-full">
                {task.order?.buyer?.name}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-700">
              Total Value: <span className="text-lg text-emerald-600 ml-1">₹{task.order?.totalAmount}</span>
            </div>
          </div>

          {/* Product Items Display */}
          {task.order?.items && task.order.items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Items to Deliver
              </p>
              <div className="grid grid-cols-1 gap-2">
                {task.order.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-[10px] text-gray-400 uppercase">
                          No Pic
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-100">
                        {item.product?.name || "Premium Item"}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMyTask && !isCompleted && (
            <div className="flex flex-wrap gap-2 mt-5">
              <Button
                onClick={() => onChat(task.order.buyer._id, task.order._id)}
                variant="outline"
                className="text-[11px] px-4 h-9 rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 flex-1 sm:flex-none font-bold"
              >
                💬 Chat Buyer
              </Button>
              <Button
                onClick={() => onChat(task.order.seller._id, task.order._id)}
                variant="outline"
                className="text-[11px] px-4 h-9 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex-1 sm:flex-none font-bold"
              >
                💬 Chat Seller
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
          {!isMyTask && onAction && (
            <Button onClick={onAction} className="w-full sm:w-auto h-11 rounded-xl bg-black hover:bg-gray-800 font-black text-sm px-8">
              {actionLabel}
            </Button>
          )}

          {isMyTask && !isCompleted && onStatusUpdate && (
            <div className="flex flex-col gap-2 w-full">
              {task.status === "ASSIGNED" && (
                <Button onClick={() => onStatusUpdate(task._id, "PICKED")} className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 font-black text-sm shadow-lg shadow-purple-100">
                  Mark as Picked Up
                </Button>
              )}
              {task.status === "IN_TRANSIT" && (
                <Button onClick={() => onStatusUpdate(task._id, "DELIVERED")} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-sm shadow-lg shadow-emerald-100">
                  Confirm Delivery
                </Button>
              )}
            </div>
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
