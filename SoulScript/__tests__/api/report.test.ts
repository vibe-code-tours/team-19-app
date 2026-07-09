import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn().mockReturnValue("decrypted content"),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  },
}));

import { POST } from "@/app/api/report/route";

function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = "0000000000000000000000000000000000000000000000000000000000000000";
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ month: "2026-01" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid month format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await POST(makeRequest({ month: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when fewer than 10 entries", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const entriesChain = chainable({
      is: vi.fn().mockResolvedValue({
        data: Array.from({ length: 5 }, (_, i) => ({ id: String(i) })),
        error: null,
      }),
    });
    mockFrom.mockReturnValue(entriesChain);

    const res = await POST(makeRequest({ month: "2026-01" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("10 entries");
  });

  it("generates report with 10+ entries", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const entriesChain = chainable({
      is: vi.fn().mockResolvedValue({
        data: Array.from({ length: 10 }, (_, i) => ({
          id: String(i),
          content: "encrypted",
          content_iv: "iv",
          primary_emotion: "joy",
          emoji: "😊",
          secondary_emotions: ["happy"],
        })),
        error: null,
      }),
    });

    const reportChain = chainable({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "report-1", month_year: "2026-01" },
            error: null,
          }),
        }),
      }),
    });

    mockFrom.mockReturnValueOnce(entriesChain).mockReturnValueOnce(reportChain);

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            summary_overview: "A good month.",
            dominant_mood: "joy",
            pattern_insights: "You felt happy often.",
            actionable_recommendations: ["Exercise", "Meditate"],
          }),
        },
      }],
    });

    const res = await POST(makeRequest({ month: "2026-01" }));
    expect(res.status).toBe(200);
  });
});
