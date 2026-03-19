import { IUser } from "@/models/User";

export function hasRole(user: IUser, roles: string[]) {
  return roles.includes(user.role);
}
