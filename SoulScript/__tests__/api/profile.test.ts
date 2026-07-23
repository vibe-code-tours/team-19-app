import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

import { GET, PATCH } from "@/app/api/profile/route";
import { resetRateLimits } from "@/lib/rate-limit";

function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return chain;
}

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when profile not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(chainable({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    }));
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns profile on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(chainable({
      single: vi.fn().mockResolvedValue({
        data: { user_id: "user-1", display_name: "Test", preferred_language: "burmese" },
        error: null,
      }),
    }));
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "New Name" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful update", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const mockSingle = vi.fn().mockResolvedValue({
      data: { user_id: "user-1", display_name: "Updated" },
      error: null,
    });
    mockFrom.mockReturnValue(chainable({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: mockSingle }),
        }),
      }),
    }));
    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "Updated" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it("returns 429 when rate limited (10 per hour)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    // Send 10 requests to exhaust the limit
    for (let i = 0; i < 10; i++) {
      mockFrom.mockReturnValue(chainable({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) }),
          }),
        }),
      }));
      const req = new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: `Test ${i}` }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    }

    // 11th request should be rate limited
    mockFrom.mockReturnValue(chainable({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) }),
        }),
      }),
    }));
    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "Too Many" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(429);
  });
});
