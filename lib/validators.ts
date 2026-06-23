import { z } from "zod";

const password = z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/\d/, "Password must contain a number");
const phone = z.string().trim().min(8).max(24).optional().or(z.literal(""));

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  phone,
  password
});

export const loginSchema = z.object({ loginId: z.string().trim().min(3).max(254), password: z.string().min(1).max(128) });
export const otpSendSchema = z.object({ channel: z.literal("EMAIL"), purpose: z.enum(["REGISTRATION", "LOGIN", "PASSWORD_RESET", "HIGH_RISK_ACTION"]).default("REGISTRATION") });
export const otpVerifySchema = otpSendSchema.extend({ code: z.string().regex(/^\d{6}$/) });

export const listingCreateSchema = z.object({
  gameId: z.string().min(1),
  gameVariantId: z.string().min(1).optional().or(z.literal("")),
  type: z.string().trim().min(2).max(40),
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(5000),
  price: z.coerce.number().positive().max(100000),
  stock: z.coerce.number().int().min(1).max(10000),
  deliveryMins: z.coerce.number().int().min(1).max(10080),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  shopName: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  termsRiskAcknowledged: z.coerce.boolean().default(false)
});

export const orderCreateSchema = z.object({
  listingId: z.string().min(1),
  paymentMethod: z.enum(["BANK_TRANSFER", "DUITNOW_QR", "FPX", "TNG_EWALLET", "GRABPAY", "BOOST"]),
  clientRequestId: z.string().uuid()
});

export const uploadSchema = z.object({ contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]) });
export const proofSchema = z.object({ reference: z.string().trim().min(3).max(120), method: z.string().trim().min(2).max(40), fileKey: z.string().max(500).optional(), fileUrl: z.url().max(2000).optional() });
export const orderActionSchema = z.object({ action: z.enum(["DELIVER", "ACCEPT", "DISPUTE", "CANCEL"]), deliverySecret: z.string().max(5000).optional(), reason: z.string().trim().min(10).max(2000).optional() });
export const withdrawalSchema = z.object({ amount: z.coerce.number().positive().max(100000), account: z.string().trim().min(6).max(500) });
export const adminDecisionSchema = z.object({ decision: z.enum(["APPROVE", "REJECT"]), note: z.string().trim().max(1000).optional() });
export const banSchema = z.object({ banned: z.boolean(), reason: z.string().trim().max(1000).optional() });
export const disputeResolutionSchema = z.object({ resolution: z.enum(["BUYER", "SELLER"]), note: z.string().trim().min(3).max(2000) });
export const messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
