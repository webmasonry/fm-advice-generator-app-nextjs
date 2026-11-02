import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { getAdvice } from "./getAdvice";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

function mockNetworkError() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  );
}

describe("getAdvice", () => {
  it("returns the slip from a valid response", async () => {
    mockFetch({
      slip: {
        advice: "Test advice.",
        id: 1,
      },
    });
    await expect(getAdvice()).resolves.toEqual({
      advice: "Test advice.",
      id: 1,
    });
  });

  it("throws when the API responds with 500", async () => {
    mockFetch({}, 500);
    await expect(getAdvice()).rejects.toThrow("Advice API failed: 500");
  });

  it("throws when the data has the wrong shape", async () => {
    mockFetch({
      slip: {
        advice: "Test advice",
        i: 1,
      },
    });
    await expect(getAdvice()).rejects.toThrow(ZodError);
  });

  it("throws when the network fails", async () => {
    mockNetworkError();
    await expect(getAdvice()).rejects.toThrow(TypeError);
  });
});
