"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react"; // make sure lucide-react is installed
import { Captcha } from "@/components/ui/Captcha";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!verified) {
      setErrorMsg("Please verify that you are not a robot.");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn(email, password);

      if (res.success && res.data?.user) {
        const role = res.data.user.role;

        if (role === "admin") window.location.href = "/admin/dashboard";
        else if (role === "seller") window.location.href = "/seller/dashboard";
        else if (role === "delivery")
          window.location.href = "/delivery/dashboard";
        else window.location.href = "/products"; // buyer or default
      } else {
        setErrorMsg(res.message || "Login failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!verified) {
      setErrorMsg("Please verify that you are not a robot.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setErrorMsg(data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!verified) {
      setErrorMsg("Please verify that you are not a robot.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setIsForgotPassword(false);
        setOtpSent(false);
        setOtp("");
        setNewPassword("");
        setPassword(newPassword); // Pre-fill login
        setErrorMsg("");
        alert("Password reset successfully! Please log in.");
      } else {
        setErrorMsg(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const getSubmitHandler = () => {
    if (isForgotPassword) {
      return otpSent ? handleResetPassword : handleSendOtp;
    }
    return handleSubmit;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-black p-4 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[64px] animate-pulse"></div>
        <div
          className="absolute top-[20%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[64px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[64px] animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <form
        onSubmit={getSubmitHandler()}
        className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/60 dark:border-gray-700 w-full max-w-md transition-all z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-tr from-pink-400 to-indigo-400 p-4 rounded-3xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800 dark:text-white tracking-tight">
          {isForgotPassword
            ? otpSent
              ? "Reset Password 🔐"
              : "Forgot Password 🤔"
            : "Welcome Back ✨"}
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm font-medium">
          {isForgotPassword
            ? "Let's get you back into your account!"
            : "We're so excited to see you again!"}
        </p>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 text-sm p-3 mb-6 block rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        {!isForgotPassword ? (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 pr-10 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrorMsg("");
                }}
                className="text-sm font-medium text-pink-500 hover:text-indigo-500 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={otpSent}
              className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 disabled:opacity-50 dark:text-white"
            />
            {otpSent && (
              <>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-900/50 border-white/60 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 rounded-xl py-3 pr-10 shadow-sm transition-all hover:bg-white/70 dark:hover:bg-gray-800/80 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </>
            )}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setOtpSent(false);
                  setErrorMsg("");
                }}
                className="text-sm font-medium text-gray-500 hover:text-indigo-500 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Captcha onVerify={setVerified} />
        </div>

        <Button
          type="submit"
          className="w-full mt-8 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white rounded-xl py-3.5 text-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border-none"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : isForgotPassword
              ? otpSent
                ? "Reset Password"
                : "Send OTP"
              : "Login"}
        </Button>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
          Don't have an account?{" "}
          <a
            href="/auth/register"
            className="text-indigo-600 font-bold hover:text-pink-500 transition-colors decoration-2 hover:underline underline-offset-4"
          >
            Join Us 🌸
          </a>
        </p>
      </form>
    </div>
  );
}
