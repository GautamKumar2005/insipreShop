"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Captcha } from "@/components/ui/Captcha";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER"); // default role
  const [errorMsg, setErrorMsg] = useState("");
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!verified) {
      setErrorMsg("Please verify that you are not a robot.");
      return;
    }

    try {
      const res = await register(name, email, phone, password, role as any);

      if (res.success && res.data?.user) {
        // Redirect to respective dashboard based on user role
        const userRole = res.data.user.role;
        if (userRole === "admin") window.location.href = "/admin/dashboard";
        else if (userRole === "seller")
          window.location.href = "/seller/dashboard";
        else if (userRole === "delivery")
          window.location.href = "/delivery/dashboard";
        else window.location.href = "/products"; // buyer or default
      } else {
        setErrorMsg(res.message || "Registration failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-black p-4 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[64px] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[64px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-[30%] left-[20%] w-[40rem] h-[40rem] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[64px] animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-gray-700 w-full max-w-md transition-all z-10 my-8"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-indigo-400 to-pink-400 p-4 rounded-3xl shadow-lg transform -rotate-3 hover:-rotate-6 transition-transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800 dark:text-white tracking-tight">
          Create Account 🌟
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm font-medium">
          Join us and start your amazing journey!
        </p>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 text-sm p-3 mb-6 block rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
          />

          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
          />

          <Input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
          />

          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-white/50 dark:bg-gray-900/50 border border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 outline-none text-sm text-gray-700 dark:text-white appearance-none cursor-pointer"
            >
              <option value="BUYER">Buyer 🛍️</option>
              <option value="SELLER">Seller 🏪</option>
              <option value="DELIVERY">Delivery 🚚</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Captcha onVerify={setVerified} />
        </div>

        <Button
          type="submit"
          className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-xl py-3.5 text-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border-none"
          disabled={loading}
        >
          {loading ? "Registering..." : "Join Now"}
        </Button>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="text-pink-600 font-bold hover:text-indigo-500 transition-colors decoration-2 hover:underline underline-offset-4"
          >
            Login ✨
          </a>
        </p>
      </form>
    </div>
  );
}
