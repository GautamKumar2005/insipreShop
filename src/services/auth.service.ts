import User from "@/models/User";
import { hashPassword, comparePassword } from "@/utils/hash";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function registerUser(data: any) {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error("User already exists");

  const hashedPassword = await hashPassword(data.password);

  const user = await User.create({
    ...data,
    password: hashedPassword,
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  return { user, accessToken, refreshToken };
}
