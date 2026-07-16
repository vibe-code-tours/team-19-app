# AES-256-GCM Encryption at Rest

## Overview

SoulScript encrypts all journal content before storing it in the database using AES-256-GCM. Decryption happens server-side only — plaintext never reaches the client.

## Implementation (`src/lib/encryption.ts`)

### Algorithm

```typescript
const ALGORITHM = "aes-256-gcm";
```

AES-256-GCM provides:
- **Confidentiality** — AES-256 encryption (256-bit key)
- **Integrity** — GCM mode includes an authentication tag (detects tampering)
- **Performance** — hardware-accelerated on modern CPUs

### Key Loading

```typescript
function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY!;
  if (!keyHex) throw new Error("ENCRYPTION_KEY environment variable is not set");
  return Buffer.from(keyHex, "hex");
}
```

- Lazy-loaded on each call (not cached at module level)
- `ENCRYPTION_KEY` is a 64-character hex string (32 bytes = 256 bits)
- No `NEXT_PUBLIC_` prefix — server-side only
- Throws immediately if missing (fail-fast)

### Encryption

```typescript
export function encrypt(text: string): { encrypted: string; iv: string } {
  const key = getKey();
  const iv = crypto.randomBytes(16);         // unique IV per entry
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return { encrypted: encrypted + ":" + authTag, iv: iv.toString("hex") };
}
```

- **IV** — 16 random bytes (128-bit), unique per entry
- **Auth tag** — appended to encrypted text with `:` separator
- Returns both encrypted text and IV (IV stored separately in DB)

### Decryption

```typescript
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
```

- Splits `encrypted:authTag` string
- Sets auth tag before decryption (GCM requires this)
- `decipher.final()` throws if auth tag verification fails (tampered data)

## Database Storage

```sql
-- journal_entries table
content text not null,      -- encrypted + ":" + authTag
content_iv text not null,   -- hex-encoded IV
```

Two columns per encrypted field:
- `content` — ciphertext with auth tag appended
- `content_iv` — initialization vector (needed for decryption)

## Flow

### Write Path (API Route)

```typescript
// src/app/api/analyze/route.ts
const truncatedContent = content.slice(0, MAX_LENGTH);
const analysis = await callAI(truncatedContent);
const { encrypted, iv } = encrypt(truncatedContent);

await supabase.from("journal_entries").insert({
  content: encrypted,
  content_iv: iv,
  // ... emotion fields
});
```

1. Content truncated to 5000 chars
2. Sent to AI for analysis (plaintext, server-side only)
3. Encrypted before DB insert

### Read Path (API Route)

```typescript
// src/app/api/entries/route.ts
const { data: entries } = await dateQuery;

const decryptedEntries = entries?.map((e) => ({
  ...e,
  content: decrypt(e.content, e.content_iv),
}));
```

1. Fetch encrypted entries from DB
2. Decrypt each entry's content
3. Return plaintext in API response (over HTTPS)

## Why Not Client-Side Encryption?

- **AI analysis** requires plaintext on the server
- **Monthly reports** require decrypting all entries server-side
- **Simpler key management** — one key, server-side only
- **No key exposure** — encryption key never sent to browser

## Key Management

- `ENCRYPTION_KEY` stored in `.env.local` (development) or Vercel/Supabase environment variables (production)
- Same key for all entries (symmetric encryption)
- Key rotation would require re-encrypting all entries

## Tests

```typescript
// __tests__/lib/encryption.test.ts
- Roundtrip: encrypt → decrypt returns original text
- Unicode: emoji, Chinese, Arabic characters
- Empty string handling
- Long text (10,000+ chars)
```

## Key Decisions

- **AES-256-GCM over AES-256-CBC** — GCM provides authentication (tamper detection) without separate HMAC
- **Lazy key loading** — avoids issues with module-level initialization timing
- **Separate IV column** — IV is not secret, but must be unique per entry
- **Auth tag in same column** — simplifies storage; only one extra column for IV
- **Server-side only** — plaintext never leaves the server
