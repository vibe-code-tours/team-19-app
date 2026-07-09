import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY!;
  if (!keyHex) throw new Error("ENCRYPTION_KEY environment variable is not set");
  return Buffer.from(keyHex, "hex");
}

export function encrypt(text: string): { encrypted: string; iv: string } {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return { encrypted: encrypted + ":" + authTag, iv: iv.toString("hex") };
}

export function decrypt(encryptedText: string, ivHex: string): string {
  const key = getKey();
  const [encrypted, authTag] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
