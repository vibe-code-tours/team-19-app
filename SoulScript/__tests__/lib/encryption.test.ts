import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

beforeAll(() => {
  // Set a test encryption key (32 bytes hex = 64 hex chars)
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encryption", () => {
  it("encrypts and decrypts text correctly", () => {
    const original = "Today was a good day";
    const { encrypted, iv } = encrypt(original);

    expect(encrypted).not.toBe(original);
    expect(iv).toBeDefined();
    expect(typeof iv).toBe("string");

    const decrypted = decrypt(encrypted, iv);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same input", () => {
    const original = "Same text twice";
    const result1 = encrypt(original);
    const result2 = encrypt(original);

    // Different IVs should produce different ciphertext
    expect(result1.encrypted).not.toBe(result2.encrypted);
    expect(result1.iv).not.toBe(result2.iv);

    // Both should decrypt to the same plaintext
    expect(decrypt(result1.encrypted, result1.iv)).toBe(original);
    expect(decrypt(result2.encrypted, result2.iv)).toBe(original);
  });

  it("handles empty string", () => {
    const { encrypted, iv } = encrypt("");
    expect(decrypt(encrypted, iv)).toBe("");
  });

  it("handles long text", () => {
    const original = "x".repeat(10000);
    const { encrypted, iv } = encrypt(original);
    expect(decrypt(encrypted, iv)).toBe(original);
  });

  it("handles unicode text", () => {
    const original = "Hello 世界 🌍 ကျွန်မ";
    const { encrypted, iv } = encrypt(original);
    expect(decrypt(encrypted, iv)).toBe(original);
  });
});
