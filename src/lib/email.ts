import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendOTP(userEmail: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "OTP Service <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<h3>Your OTP for inspireShop is <strong>${otp}</strong></h3>`
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("Email sent:", data);
    return true;
  } catch (error) {
    console.error("Resend exception:", error);
    return false;
  }
}
