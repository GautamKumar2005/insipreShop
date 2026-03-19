"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type DeliveryTask = {
  _id: string;
  orderId: string;
  address: string;
  status: "PENDING" | "ACCEPTED" | "PICKED" | "DELIVERED";
};

export default function DeliveryTasksPage() {
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/delivery/tasks", {
        headers: {
          "x-user-id": localStorage.getItem("userId") || "",
          "x-user-role": "DELIVERY",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to load tasks");
      } else {
        setTasks(data.tasks || []);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    try {
      await fetch("/api/orders/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
          "x-user-role": "DELIVERY",
        },
        body: JSON.stringify({
          taskId,
          status,
        }),
      });

      fetchTasks();
    } catch {
      alert("Failed to update status");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <p className="p-6">Loading tasks...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Delivery Tasks</h1>

      {tasks.length === 0 ? (
        <p className="text-gray-500">No delivery tasks assigned.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="border rounded-lg p-4 flex flex-col gap-2"
            >
              <p className="font-semibold">Order ID: {task.orderId}</p>
              <p className="text-sm text-gray-600">
                Delivery Address: {task.address}
              </p>
              <p className="text-sm">
                Status:{" "}
                <span className="font-medium">{task.status}</span>
              </p>

              <div className="flex gap-2 mt-2">
                {task.status === "PENDING" && (
                  <Button
                    onClick={() => updateStatus(task._id, "ACCEPTED")}
                  >
                    Accept
                  </Button>
                )}

                {task.status === "ACCEPTED" && (
                  <Button
                    onClick={() => updateStatus(task._id, "PICKED")}
                  >
                    Mark Picked
                  </Button>
                )}

                {task.status === "PICKED" && (
                  <Button
                    onClick={() => updateStatus(task._id, "DELIVERED")}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
