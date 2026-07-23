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

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } },
  }),
}));

import { DELETE } from "@/app/api/account/route";
import { resetRateLimits } from "@/lib/rate-limit";

function chainable(result: Record<string, unknown> = { error: null }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    then: vi.fn((onFulfilled?: (v: Record<string, unknown>) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
    ),
    catch: vi.fn(),
  };
  return chain;
}

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("deletes all user data and returns 200", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(chainable());
    const res = await DELETE();
    expect(res.status).toBe(200);
  });

  it("returns 500 when deletion fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(chainable({ error: { message: "db error" } }));
    const res = await DELETE();
    expect(res.status).toBe(500);
  });

  it("returns 429 when rate limited (1 per hour)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockReturnValue(chainable());

    const res1 = await DELETE();
    expect(res1.status).toBe(200);

    const res2 = await DELETE();
    expect(res2.status).toBe(429);
    const data = await res2.json();
    expect(data.error).toContain("rate-limited");
  });
});
