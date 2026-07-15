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

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  },
}));

import { POST } from "@/app/api/analyze/route";

function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: { id: "entry-1" }, error: null }),
    ...overrides,
  };
  return chain;
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = "0000000000000000000000000000000000000000000000000000000000000000";
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ content: "Hello world" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when content is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is too short", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const res = await POST(makeRequest({ content: "Hi" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("10 characters");
  });

  it("returns 429 when daily limit reached", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    // Mock the count query to return 10
    const countChain = chainable();
    countChain.select.mockReturnValue({
      ...countChain,
      head: true,
      count: 10,
    });
    mockFrom.mockReturnValue(countChain);

    const res = await POST(makeRequest({ content: "A".repeat(15) }));
    expect(res.status).toBe(429);
  });

  it("returns 200 with entry on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // Mock the rate limit chain to return count < 10
    const rateLimitChain = chainable();
    rateLimitChain.select.mockReturnValue({
      ...rateLimitChain,
      head: true,
      count: 0,
    });

    // Mock the insert chain
    const insertChain = chainable({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "entry-1" }, error: null }),
      }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return rateLimitChain; // rate limit query
      return insertChain; // insert
    });

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            primary_emotion: "joy",
            emoji: "😊",
            secondary_emotions: ["happy"],
            glow_theme: "from-amber-500/20 to-yellow-600/20",
          }),
        },
      }],
    });

    const res = await POST(makeRequest({ content: "A".repeat(15) }));
    expect(res.status).toBe(200);
  });
});
