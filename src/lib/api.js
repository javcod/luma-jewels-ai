// Minimal fetch-based client for the LumaJewel backend (see backend/README.md).
//
// Deliberately dependency-free: native `fetch` only, no axios/React Query.
// Nothing in this file touches React — it's plain functions any component
// can call. Base URL comes from VITE_API_BASE_URL (Vite's built-in env var
// support, no extra config needed), falling back to the local dev backend.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Thrown for any non-2xx response. Carries the HTTP status and, where the
 * backend returned one, its parsed error body — so callers can distinguish
 * e.g. a 404 "not found" from a 422 validation error from a 500, without
 * parsing strings.
 */
export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Extract a human-readable message from a FastAPI-style error body.
 * Handles the shapes this backend actually produces:
 *   - HTTPException:            { "detail": "Product 9999 not found" }
 *   - Pydantic validation (422): { "detail": [{ "msg": "...", ... }, ...] }
 *   - Global handler (500):     { "status": "error", "detail": "Internal server error" }
 */
function extractErrorMessage(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((entry) => entry.msg || JSON.stringify(entry)).join("; ");
  }
  return fallback;
}

/**
 * Shared response handler: parses JSON and throws ApiError for non-2xx
 * responses. Never throws on a malformed/empty error body — falls back to
 * the HTTP status text instead.
 */
async function handleResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // No JSON body (e.g. a network-layer error page) — body stays null.
  }

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status} ${response.statusText}`;
    throw new ApiError(extractErrorMessage(body, fallback), { status: response.status, body });
  }

  return body;
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (cause) {
    // Network-level failure (backend unreachable, CORS, offline, etc.) —
    // fetch rejects rather than resolving, so it needs its own ApiError.
    throw new ApiError("Unable to reach the LumaJewel backend. Is it running?", { status: null, body: null, cause });
  }
  return handleResponse(response);
}

/**
 * GET /products — optionally filtered.
 * @param {{category?: string, metal?: string, gemstone?: string, min_price?: number, max_price?: number}} filters
 * @returns {Promise<{count: number, items: object[]}>}
 */
export function getProducts(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return request(`/products${query ? `?${query}` : ""}`);
}

/**
 * GET /products/{id} — a single product, or throws ApiError (status 404)
 * if it doesn't exist.
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export function getProduct(id) {
  return request(`/products/${encodeURIComponent(id)}`);
}

/**
 * POST /concierge/chat — send one user message, get back the Concierge's
 * reply plus any real, catalog-grounded product recommendations and the
 * user-safe activity trace.
 * @param {string} message
 * @returns {Promise<{message: string, recommended_products: object[], tools_used: string[], applied_filters: object|null, iterations: number, trace: object[]}>}
 */
export function sendConciergeMessage(message) {
  return request("/concierge/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}
