"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function DeliveryLocationPage() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(false);

  const sendLocation = async (lat: number, lng: number) => {
    try {
      await fetch("/api/delivery/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
          "x-user-role": "DELIVERY",
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
    } catch {
          }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setTracking(true);

    navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        sendLocation(lat, lng);
      },
      () => {
        setError("Location access denied");
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );
  };

  useEffect(() => {
    return () => {
      navigator.geolocation?.clearWatch?.(0);
    };
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Live Location</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="border rounded-lg p-4 mb-4">
        <p>
          <strong>Latitude:</strong>{" "}
          {latitude !== null ? latitude : "Not available"}
        </p>
        <p>
          <strong>Longitude:</strong>{" "}
          {longitude !== null ? longitude : "Not available"}
        </p>
      </div>

      {!tracking ? (
        <Button onClick={startTracking}>Start Location Sharing</Button>
      ) : (
        <p className="text-green-600 font-medium">
          📍 Location tracking active
        </p>
      )}
    </div>
  );
}
