// Fetch client for the backend API. Base URL comes from VITE_API_BASE_URL.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Thrown for non-2xx responses; includes the status and parsed error body. */
export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Get a readable message from a FastAPI error body (string or validation list). */
function extractErrorMessage(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((entry) => entry.msg || JSON.stringify(entry)).join("; ");
  }
  return fallback;
}

/** Parse JSON and throw ApiError for non-2xx responses. */
async function handleResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // No JSON body
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
    // Network failure (backend down, CORS, offline)
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
 * GET /products/{id}. Throws ApiError (404) if not found.
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export function getProduct(id) {
  return request(`/products/${encodeURIComponent(id)}`);
}

/**
 * POST /concierge/chat: returns the reply, recommended products and activity trace.
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
