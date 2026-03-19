export const runtime = "nodejs"; // ⚠ Important: JWT works only in Node runtime
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * ❗ DO NOT use fallback secrets in auth systems
 * If env is missing, app should fail loudly
 */
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
// ----------------------------
// Generate Tokens
// ----------------------------
export function generateToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

// ----------------------------
// Verify Tokens
// ----------------------------
export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err: any) {
        return null;
  }
}


export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
