import { useState } from "react";
import { Loader2, Check } from "lucide-react";

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export function Captcha({ onVerify }: CaptchaProps) {
  const [status, setStatus] = useState<"idle" | "verifying" | "verified">(
    "idle",
  );

  const handleVerify = () => {
    if (status !== "idle") return;
    setStatus("verifying");
    // Simulate verification delay
    setTimeout(
      () => {
        setStatus("verified");
        onVerify(true);
      },
      1000 + Math.random() * 1000,
    );
  };

  return (
    <div className="flex items-center justify-between box-border rounded-[3px] border border-[#d3d3d3] bg-[#f9f9f9] p-3 shadow-[0px_0px_4px_1px_rgba(0,0,0,0.08)] w-full transition-all">
      <div className="flex items-center gap-3">
        {status === "idle" && (
          <button
            type="button"
            onClick={handleVerify}
            className="w-7 h-7 bg-white border-2 border-[#c1c1c1] rounded-[2px] hover:border-[#b2b2b2] hover:shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Verify you are human"
          />
        )}
        {status === "verifying" && (
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
        )}
        {status === "verified" && (
          <div className="w-7 h-7 flex items-center justify-center">
            <Check
              className="w-8 h-8 text-green-600 drop-shadow-sm"
              strokeWidth={4}
            />
          </div>
        )}
        <span
          className="text-[14px] text-[#222]"
          style={{ fontFamily: "Roboto, helvetica, arial, sans-serif" }}
        >
          I'm not a robot
        </span>
      </div>
      <div className="flex flex-col items-center justify-center">
        <img
          src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
          alt="reCAPTCHA logo"
          className="w-8 opacity-80"
        />
        <div className="text-[10px] text-[#555] mt-1 flex flex-col items-center leading-[10px]">
          <span>reCAPTCHA</span>
          <div className="flex gap-1 text-[8px] mt-1">
            <a href="#" className="hover:underline text-[#555]">
              Privacy
            </a>
            <span>-</span>
            <a href="#" className="hover:underline text-[#555]">
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
