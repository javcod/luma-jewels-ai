import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getProducts, getProduct, sendConciergeMessage, ApiError } from "./api";

// This is the layer App.jsx's product grid and LumaConcierge both call
// into — see src/App.jsx (getProducts) and
// src/components/Concierge/LumaConcierge.jsx (sendConciergeMessage).
// Testing it directly here (rather than mounting the full page, which pulls
// in Lenis/IntersectionObserver-dependent sections) covers the same
// fetching/error-handling contract with far less test-environment risk.
describe("lib/api", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getProducts", () => {
    it("returns the parsed catalog on success", async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ count: 1, items: [{ id: 1, name: "Astraea Diamond Ring" }] }),
      });

      const result = await getProducts();

      expect(result.count).toBe(1);
      expect(result.items[0].name).toBe("Astraea Diamond Ring");
    });

    it("builds a query string from provided filters, omitting empty ones", async () => {
      globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ count: 0, items: [] }) });

      await getProducts({ category: "Rings", max_price: 5000, gemstone: "" });

      const calledUrl = globalThis.fetch.mock.calls[0][0];
      expect(calledUrl).toContain("category=Rings");
      expect(calledUrl).toContain("max_price=5000");
      expect(calledUrl).not.toContain("gemstone");
    });

    it("throws ApiError with the backend's detail message on a non-2xx response", async () => {
      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Product 9999 not found" }),
      });

      await expect(getProduct(9999)).rejects.toMatchObject({
        name: "ApiError",
        status: 404,
        message: "Product 9999 not found",
      });
    });

    it("throws a user-friendly ApiError when the network request itself fails", async () => {
      globalThis.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(getProducts()).rejects.toBeInstanceOf(ApiError);
      await expect(getProducts()).rejects.toMatchObject({
        message: "Unable to reach the LumaJewel backend. Is it running?",
      });
    });
  });

  describe("sendConciergeMessage", () => {
    it("POSTs the message and returns the Concierge response", async () => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Here are a few pieces under $5,000.",
          recommended_products: [{ id: 1, name: "Astraea Diamond Ring" }],
          tools_used: ["filter_products"],
          applied_filters: { max_price: 5000 },
          iterations: 1,
          trace: [],
        }),
      });

      const result = await sendConciergeMessage("Show me something under $5000");

      const [, options] = globalThis.fetch.mock.calls[0];
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ message: "Show me something under $5000" });
      expect(result.recommended_products).toHaveLength(1);
      expect(result.tools_used).toEqual(["filter_products"]);
    });

    it("surfaces a 500 as an ApiError rather than throwing a raw response", async () => {
      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ status: "error", detail: "Internal server error" }),
      });

      await expect(sendConciergeMessage("hello")).rejects.toMatchObject({
        status: 500,
        message: "Internal server error",
      });
    });
  });
});
