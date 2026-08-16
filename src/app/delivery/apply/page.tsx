"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function DeliveryApplyPage() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleApply = async () => {
    if (!vehicleNumber || !licenseNumber) {
      setMessage("All fields are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/delivery/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
          "x-user-role": "USER",
        },
        body: JSON.stringify({
          vehicleNumber,
          licenseNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Application failed");
      } else {
        setMessage("✅ Application submitted successfully!");
        setVehicleNumber("");
        setLicenseNumber("");
      }
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg text-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Apply as Delivery Partner</h1>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Submit your details to become a delivery partner.
      </p>

      <div className="space-y-4">
        <Input
          placeholder="Vehicle Number"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
        />

        <Input
          placeholder="Driving License Number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
        />

        {message && (
          <p className={`text-sm text-center font-medium ${message.includes("✅") ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{message}</p>
        )}

        <Button
          className="w-full"
          onClick={handleApply}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Apply"}
        </Button>
      </div>
    </div>
  );
}
