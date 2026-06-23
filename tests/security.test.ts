import assert from "node:assert/strict";
import test from "node:test";
import { generateOtp, hashOtp, hashPassword, normalizeEmail, normalizeMalaysianPhone, safeHashEqual, verifyPassword } from "../lib/security-core";

process.env.OTP_SECRET = "test-otp-secret-with-sufficient-entropy";

test("normalizes Malaysian contact identifiers", () => {
  assert.equal(normalizeEmail(" User@Example.MY "), "user@example.my");
  assert.equal(normalizeMalaysianPhone("012-345 6789"), "+60123456789");
  assert.equal(normalizeMalaysianPhone("+60 12 345 6789"), "+60123456789");
});

test("password hashes are salted and verifiable", async () => {
  const first = await hashPassword("SecurePass123");
  const second = await hashPassword("SecurePass123");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("SecurePass123", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});

test("OTP generation and keyed hashes are stable", () => {
  const code = generateOtp();
  assert.match(code, /^\d{6}$/);
  assert.equal(safeHashEqual(hashOtp(code), hashOtp(code)), true);
  assert.equal(safeHashEqual(hashOtp(code), hashOtp("000000")), code === "000000");
});
