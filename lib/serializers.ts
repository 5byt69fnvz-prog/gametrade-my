import type { Prisma } from "@prisma/client";

export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === "bigint") return item.toString();
    if (item && typeof item === "object" && item.constructor?.name === "Decimal") return item.toString();
    return item;
  })) as T;
}

export const publicUserSelect = {
  id: true,
  name: true,
  role: true,
  emailVerified: true,
  phoneVerified: true,
  realNameVerified: true,
  banned: true,
  createdAt: true,
  sellerProfile: true
} satisfies Prisma.UserSelect;
