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

import { POST, GET } from "@/app/api/report/route";

/**
 * Create a mock Supabase query chain where all intermediate methods
 * return the chain (fluent API). The chain is thenable — `await chain`
 * resolves to the given `result`.
 */
function mockChain(result: Record<string, unknown> = { data: null, error: null }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((onFulfilled?: (v: Record<string, unknown>) => unknown) =>
      Promise.resolve(result).then(onFulfilled)
    ),
    catch: vi.fn(),
  };
  return chain;
}

/**
 * Create a mock chain where `.upsert()` returns a sub-chain
 * of `.select().single()` (the actual Supabase upsert pattern).
 */
function mockUpsertChain(result: Record<string, unknown> = { data: null, error: null }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const upsert = vi.fn().mockReturnValue({ select, single });

  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert,
    then: vi.fn((onFulfilled?: (v: Record<string, unknown>) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled)
    ),
    catch: vi.fn(),
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
    const entriesData = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    mockFrom.mockReturnValue(mockChain({ data: entriesData, error: null }));

    const res = await POST(makeRequest({ month: "2026-01" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("10 entries");
  });

  it("returns 200 when existing report is up-to-date", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const entriesData = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      content: "encrypted",
      content_iv: "iv",
      primary_emotion: "joy",
      emoji: "😊",
      secondary_emotions: ["happy"],
      created_at: "2026-01-15T00:00:00Z",
    }));
    const entriesChain = mockChain({ data: entriesData, error: null });

    // Existing report found (no new entries)
    const existingReportChain = mockChain({
      data: { created_at: "2026-01-20T00:00:00Z" },
      error: null,
    });

    // Full report data for the check query
    const fullReportChain = mockChain({
      data: {
        summary_overview: "A good month.",
        dominant_mood: "joy",
        pattern_insights: "You felt happy often.",
        actionable_recommendations: ["Exercise"],
      },
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(entriesChain)       // entries query
      .mockReturnValueOnce(existingReportChain) // existing report check
      .mockReturnValueOnce(fullReportChain);    // full report fetch

    const res = await POST(makeRequest({ month: "2026-01" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cached).toBe(true);
  });

  it("generates report with 10+ entries", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const entriesData = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      content: "encrypted",
      content_iv: "iv",
      primary_emotion: "joy",
      emoji: "😊",
      secondary_emotions: ["happy"],
      created_at: "2026-01-15T00:00:00Z",
    }));
    const entriesChain = mockChain({ data: entriesData, error: null });

    // No existing report found
    const noReportChain = mockChain({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    // Upsert succeeds
    const upsertChain = mockUpsertChain({
      data: { id: "report-1", month_year: "2026-01" },
      error: null,
    });

    mockFrom
      .mockReturnValueOnce(entriesChain)    // entries query
      .mockReturnValueOnce(noReportChain)   // existing report check (not found)
      .mockReturnValueOnce(upsertChain);     // upsert

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

function makeGetRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/report");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), { method: "GET" });
}

describe("GET /api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeGetRequest({ month: "2026-07" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid month format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await GET(makeGetRequest({ month: "invalid" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("YYYY-MM");
  });

  it("returns 400 when month param is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await GET(makeGetRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 200 with stats and report data", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const entriesData = [
      { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-01T10:00:00Z", secondary_emotions: [] },
      { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-02T10:00:00Z", secondary_emotions: [] },
      { primary_emotion: "sadness", emoji: "😢", created_at: "2026-07-03T10:00:00Z", secondary_emotions: [] },
    ];
    const entriesChain = mockChain({ data: entriesData, error: null });

    const reportData = {
      summary_overview: "A good month.",
      dominant_mood: "joy",
      pattern_insights: "You felt happy often.",
      actionable_recommendations: ["Exercise"],
      created_at: "2026-07-20T00:00:00Z",
    };
    const reportChain = mockChain({ data: reportData, error: null });

    mockFrom
      .mockReturnValueOnce(entriesChain)  // entries query
      .mockReturnValueOnce(reportChain);   // report query

    const res = await GET(makeGetRequest({ month: "2026-07" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.stats).toBeDefined();
    expect(data.stats.entryCount).toBe(3);
    expect(data.stats.moodDistribution).toHaveLength(2);
    expect(data.stats.streak).toBeDefined();
    expect(data.report).toBeDefined();
    expect(data.report.summary).toBe("A good month.");
  });

  it("returns 200 with null report when no report exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const entriesData = [
      { primary_emotion: "calm", emoji: "😌", created_at: "2026-07-01T10:00:00Z", secondary_emotions: [] },
    ];
    const entriesChain = mockChain({ data: entriesData, error: null });

    const reportChain = mockChain({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    mockFrom
      .mockReturnValueOnce(entriesChain)  // entries query
      .mockReturnValueOnce(reportChain);   // report query

    const res = await GET(makeGetRequest({ month: "2026-07" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.stats.entryCount).toBe(1);
    expect(data.report).toBeNull();
  });

  it("returns 500 on database error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const entriesChain = mockChain({
      data: null,
      error: { message: "DB error", code: "500" },
    });

    mockFrom.mockReturnValue(entriesChain);

    const res = await GET(makeGetRequest({ month: "2026-07" }));
    expect(res.status).toBe(500);
  });
});
