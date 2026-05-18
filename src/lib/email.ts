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
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function sendSocialNotification(
  toEmail: string,
  recipientName: string,
  senderName: string,
  type: "like" | "comment" | "follow",
  contentPreview?: string
) {
  try {
    let subject = "";
    let htmlContent = "";
    
    // Aesthetic configurations
    const themeColor = "#6366f1"; // Indigo
    const containerStyle = "max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;";
    const headerStyle = `color: #111827; font-size: 24px; font-weight: 700; margin-bottom: 16px;`;
    const textStyle = "color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;";
    const cardStyle = "background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; margin-bottom: 24px; font-style: italic; color: #374151;";
    const buttonStyle = `display: inline-block; background-color: ${themeColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;`;
    
    if (type === "like") {
      subject = `${senderName} liked your post!`;
      htmlContent = `
        <div style="${containerStyle}">
          <h2 style="${headerStyle}">New Like! ❤️</h2>
          <p style="${textStyle}">Hi ${recipientName},<br/><br/><strong>${senderName}</strong> just liked your post on inspireShop.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/social" style="${buttonStyle}">View your post</a>
        </div>
      `;
    } else if (type === "comment") {
      subject = `${senderName} commented on your post`;
      htmlContent = `
        <div style="${containerStyle}">
          <h2 style="${headerStyle}">New Comment 💬</h2>
          <p style="${textStyle}">Hi ${recipientName},<br/><br/><strong>${senderName}</strong> just commented on your post:</p>
          ${contentPreview ? `<div style="${cardStyle}">"${contentPreview}"</div>` : ''}
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/social" style="${buttonStyle}">Reply to comment</a>
        </div>
      `;
    } else if (type === "follow") {
      subject = `${senderName} is now following you!`;
      htmlContent = `
        <div style="${containerStyle}">
          <h2 style="${headerStyle}">New Follower! 👤</h2>
          <p style="${textStyle}">Hi ${recipientName},<br/><br/>Great news! <strong>${senderName}</strong> started following you. Check out their profile and build your community.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/social" style="${buttonStyle}">See your followers</a>
        </div>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: "inspireShop Social <onboarding@resend.dev>",
      to: [toEmail],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send notification email:", error);
    return false;
  }
}
