"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function RefreshPage() {
  const router = useRouter();
  const { refreshToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await refreshToken();
        if (res.success) {
          // Redirect to home or dashboard after refresh
          router.push("/");
        } else {
          setErrorMsg(res.message || "Session expired");
          setLoading(false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Session expired");
        setLoading(false);
      }
    };

    refresh();
  }, [router, refreshToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Refreshing session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <p className="text-red-500 mb-4">{errorMsg}</p>
      <Button onClick={() => router.push("/auth/login")}>Go to Login</Button>
    </div>
  );
}
