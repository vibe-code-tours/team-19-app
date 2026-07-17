# Testing Strategy with Vitest

## Overview

SoulScript uses Vitest as the test runner with `@testing-library/react` for component tests and `@testing-library/jest-dom` for DOM matchers. Tests mirror the `src/` structure under `__tests__/`.

## Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
```

- **`jsdom`** — browser-like DOM environment for React component tests
- **`globals: true`** — `describe`, `it`, `expect` available without imports
- **`vite-tsconfig-paths`** — resolves `@/` path alias in tests
- **`setupFiles`** — loads test utilities before each test file

## Test Structure

```
__tests__/
  setup.ts              # Test setup (jest-dom matchers)
  lib/
    encryption.test.ts  # Encryption roundtrip tests
    language.test.ts    # Language detection tests
    mood-themes.test.ts # Mood theme validation tests
    utils.test.ts       # Utility function tests
  api/
    analyze.test.ts     # POST /api/analyze tests
    entries.test.ts     # GET /api/entries tests
    entries-id.test.ts  # PATCH/DELETE /api/entries/[id] tests
    report.test.ts      # POST /api/report tests
    account.test.ts     # DELETE /api/account tests
  hooks/
    useTodayEntries.test.ts  # Query hook tests
    useCreateEntry.test.ts   # Mutation hook tests
    useDeleteEntry.test.ts   # Mutation hook tests
  components/
    EntryList.test.ts   # Component rendering tests
    EntryCard.test.ts   # Component rendering tests
```

Mirrors `src/` for easy navigation.

## Library Unit Tests

### Encryption Tests

```typescript
// __tests__/lib/encryption.test.ts
import { encrypt, decrypt } from "@/lib/encryption";

describe("encryption", () => {
  it("roundtrips text correctly", () => {
    const text = "Hello, world!";
    const { encrypted, iv } = encrypt(text);
    expect(decrypt(encrypted, iv)).toBe(text);
  });

  it("handles unicode characters", () => {
    const text = "😊 မင်္ဂလာပါ";
    const { encrypted, iv } = encrypt(text);
    expect(decrypt(encrypted, iv)).toBe(text);
  });

  it("produces different ciphertext for same plaintext", () => {
    const text = "same text";
    const r1 = encrypt(text);
    const r2 = encrypt(text);
    expect(r1.encrypted).not.toBe(r2.encrypted);  // different IVs
  });
});
```

### Language Detection Tests

```typescript
// __tests__/lib/language.test.ts
import { detectLanguage } from "@/lib/language";

describe("detectLanguage", () => {
  it("detects Burmese text", () => {
    expect(detectLanguage("မင်္ဂလာပါ")).toBe("burmese");
  });

  it("detects English text", () => {
    expect(detectLanguage("Hello world")).toBe("english");
  });

  it("defaults to English for empty string", () => {
    expect(detectLanguage("")).toBe("english");
  });
});
```

### Mood Theme Validation Tests

```typescript
// __tests__/lib/mood-themes.test.ts
import { validateGlowTheme, DEFAULT_THEME } from "@/lib/mood-themes";

describe("validateGlowTheme", () => {
  it("returns valid theme", () => {
    const valid = "from-amber-500/20 to-yellow-600/20";
    expect(validateGlowTheme(valid)).toBe(valid);
  });

  it("returns default for invalid theme", () => {
    expect(validateGlowTheme("invalid")).toBe(DEFAULT_THEME);
  });

  it("returns default for empty string", () => {
    expect(validateGlowTheme("")).toBe(DEFAULT_THEME);
  });
});
```

## API Route Tests

API routes are tested by importing the handler and calling it with mock requests:

```typescript
// __tests__/api/analyze.test.ts
import { POST } from "@/app/api/analyze/route";

// Mock Supabase, AI client, encryption
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  callAI: vi.fn(),
  validateResult: vi.fn(),
}));

describe("POST /api/analyze", () => {
  it("returns 401 for unauthenticated user", async () => {
    // Mock supabase.auth.getUser to return null user
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ content: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 for short content", async () => {
    // Mock authenticated user
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ content: "hi" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

## Running Tests

```bash
npm run test              # Run all tests
npm run test:coverage     # Run with coverage report
npx vitest --watch        # Watch mode
npx vitest run lib        # Run only lib tests
```

## Mocking Patterns

### Supabase Client

```typescript
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    // ... chainable methods
  }),
}));
```

### AI Client

```typescript
vi.mock("@/lib/ai", () => ({
  callAI: vi.fn().mockResolvedValue({
    primary_emotion: "joy",
    emoji: "😊",
    secondary_emotions: ["happy"],
    glow_theme: "from-amber-500/20 to-yellow-600/20",
  }),
  validateResult: vi.fn((r) => r),
}));
```

### Fetch

```typescript
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ entries: [] }),
}));
```

## Key Decisions

- **Vitest over Jest** — faster, native ESM support, Vite-compatible
- **`jsdom` environment** — DOM testing without a real browser
- **Mirror structure** — `__tests__/` mirrors `src/` for easy file location
- **Handler-level API tests** — test route handlers directly, not HTTP requests
- **Chainable mocks** — Supabase's fluent API requires `mockReturnThis()` chains
- **No snapshot tests** — explicit assertions are more maintainable
- **Coverage reporters** — text for terminal, HTML for browsing
