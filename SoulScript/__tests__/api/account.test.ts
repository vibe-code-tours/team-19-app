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

function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
  return chain;
}

describe("DELETE /api/account", () => {
  beforeEach(() => vi.clearAllMocks());

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
    mockFrom.mockReturnValue(chainable({
      eq: vi.fn().mockResolvedValue({ error: { message: "db error" } }),
    }));
    const res = await DELETE();
    expect(res.status).toBe(500);
  });
});
