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

vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn().mockReturnValue("decrypted content"),
}));

import { GET } from "@/app/api/entries/route";
import { PATCH, DELETE } from "@/app/api/entries/[id]/route";

function chainable(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
    ...overrides,
  };
  // Make it thenable so await works
  chain.then = chain.then.bind(chain);
  return chain;
}

describe("GET /api/entries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new Request("http://localhost/api/entries?month=2026-01");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid month format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const req = new Request("http://localhost/api/entries?month=invalid");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns entries for valid month", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = chainable({
      then: function (this: unknown, resolve: (v: unknown) => void) {
        resolve({ data: [{ id: "1", content: "encrypted", content_iv: "iv123" }], error: null });
      },
    });
    mockFrom.mockReturnValue(chain);

    const req = new Request("http://localhost/api/entries?month=2026-01");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/entries/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new Request("http://localhost/api/entries/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primary_emotion: "joy" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 when no fields provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const req = new Request("http://localhost/api/entries/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid emotion", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const req = new Request("http://localhost/api/entries/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primary_emotion: "invalid_mood" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/entries/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new Request("http://localhost/api/entries/1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful soft delete", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ update: mockUpdate });
    const req = new Request("http://localhost/api/entries/1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/entries with start/end params", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new Request(
      "http://localhost/api/entries?start=2026-07-15T00:00:00.000Z&end=2026-07-16T00:00:00.000Z"
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when neither start/end nor month provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const req = new Request("http://localhost/api/entries");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns entries for valid start/end range", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = chainable({
      then: function (this: unknown, resolve: (v: unknown) => void) {
        resolve({ data: [{ id: "1", content: "encrypted", content_iv: "iv123" }], error: null });
      },
    });
    mockFrom.mockReturnValue(chain);

    const req = new Request(
      "http://localhost/api/entries?start=2026-07-15T00:00:00.000Z&end=2026-07-16T00:00:00.000Z"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(1);
  });

  it("start/end takes precedence over month when both provided", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = chainable({
      then: function (this: unknown, resolve: (v: unknown) => void) {
        resolve({ data: [], error: null });
      },
    });
    mockFrom.mockReturnValue(chain);

    const req = new Request(
      "http://localhost/api/entries?start=2026-07-15T00:00:00.000Z&end=2026-07-16T00:00:00.000Z&month=2026-07"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("month param still works (backward compatible)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const chain = chainable({
      then: function (this: unknown, resolve: (v: unknown) => void) {
        resolve({ data: [{ id: "1", content: "encrypted", content_iv: "iv123" }], error: null });
      },
    });
    mockFrom.mockReturnValue(chain);

    const req = new Request("http://localhost/api/entries?month=2026-07");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
