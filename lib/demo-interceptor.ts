/**
 * demo-interceptor.ts
 *
 * Client-side fetch interceptor for demo mode.
 * Intercepts all /api/* requests when demo_mode cookie is set:
 *   - GET  → returns sessionStorage-cached data (falls back to real server on first load)
 *   - POST → writes to sessionStorage, returns synthetic success response
 *   - PATCH/PUT → updates sessionStorage, returns synthetic response
 *   - DELETE → removes from sessionStorage, returns { success: true }
 *
 * Data is stored in sessionStorage, which the browser clears automatically
 * when the tab is closed — satisfying the "editable but nothing persists" requirement.
 */

const STORE_PREFIX = "demo:";

// ─── sessionStorage helpers ───────────────────────────────────────────────────

function storeKey(url: string): string {
  return STORE_PREFIX + url.split("?")[0];
}

function loadData(url: string): unknown {
  try {
    const raw = sessionStorage.getItem(storeKey(url));
    return raw !== null ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function saveData(url: string, data: unknown): void {
  try {
    sessionStorage.setItem(storeKey(url), JSON.stringify(data));
  } catch {
    // sessionStorage may be full or unavailable — fail silently
  }
}

// ─── URL analysis ────────────────────────────────────────────────────────────

interface ParsedUrl {
  collectionUrl: string;
  itemId: string | null;
  subAction: string | null;
}

/**
 * Parse an /api/* pathname into its structural components.
 *
 * Handles two main shapes used throughout the app:
 *   /api/projects/{projectId}/{resource}[/{itemId}[/{subAction}...]]
 *   /api/{resource}[/{itemId}[/{subAction}...]]
 */
function parseApiUrl(pathname: string): ParsedUrl {
  const path = pathname.split("?")[0];
  const parts = path.split("/").filter(Boolean);
  // parts[0] === "api"

  // /api/projects/{projectId}/{resource}[/{itemId}[/{subAction}...]]
  if (parts[1] === "projects") {
    if (parts.length === 2) {
      return { collectionUrl: path, itemId: null, subAction: null };
    }
    if (parts.length === 3) {
      // /api/projects/{projectId}
      return { collectionUrl: "/api/projects", itemId: parts[2], subAction: null };
    }
    // parts.length >= 4 → /api/projects/{projectId}/{resource}[/{itemId}[/{subAction}...]]
    const collectionUrl = `/api/projects/${parts[2]}/${parts[3]}`;
    const itemId = parts[4] ?? null;
    const subAction = parts.length > 5 ? parts.slice(5).join("/") : null;
    return { collectionUrl, itemId, subAction };
  }

  // /api/v1/projects/{projectId}/{resource}[/{itemId}[/{subAction}...]]
  if (parts[1] === "v1" && parts[2] === "projects") {
    if (parts.length <= 4) {
      return { collectionUrl: path, itemId: null, subAction: null };
    }
    const collectionUrl = `/api/v1/projects/${parts[3]}/${parts[4]}`;
    const itemId = parts[5] ?? null;
    const subAction = parts.length > 6 ? parts.slice(6).join("/") : null;
    return { collectionUrl, itemId, subAction };
  }

  // /api/{resource}[/{itemId}[/{subAction}...]]
  if (parts.length === 2) {
    return { collectionUrl: path, itemId: null, subAction: null };
  }
  const collectionUrl = `/${parts[0]}/${parts[1]}`;
  const itemId = parts[2] ?? null;
  const subAction = parts.length > 3 ? parts.slice(3).join("/") : null;
  return { collectionUrl, itemId, subAction };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toCollection(val: unknown): Record<string, unknown>[] {
  return Array.isArray(val) ? (val as Record<string, unknown>[]) : [];
}

async function parseBody(init: RequestInit | undefined): Promise<Record<string, unknown>> {
  if (!init?.body) return {};
  try {
    if (typeof init.body === "string") return JSON.parse(init.body);
  } catch {
    // FormData or other non-JSON body — return empty object
  }
  return {};
}

/**
 * Detect the sequential-number field used by a resource collection
 * (e.g. "rfi_number", "submittal_number") so the interceptor can
 * auto-increment it for newly created items.
 */
function detectNumberField(items: Record<string, unknown>[]): string | null {
  if (items.length === 0) return null;
  for (const key of Object.keys(items[0])) {
    if (key.endsWith("_number") && typeof items[0][key] === "number") return key;
  }
  return null;
}

// ─── Sub-action handlers ──────────────────────────────────────────────────────

function handleSubAction(
  subAction: string,
  collectionUrl: string,
  itemId: string | null,
  init: RequestInit | undefined
): Response {
  if (subAction === "attachment" || subAction === "photo") {
    // File upload — acknowledge but don't actually store the file
    if (itemId) {
      const collection = toCollection(loadData(collectionUrl));
      const idx = collection.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        const item = collection[idx];
        const existing = Array.isArray(item.attachments) ? item.attachments : [];
        const fakeAttachment = { name: "demo-file.pdf", url: "#demo" };
        const updated = { ...item, attachments: [...existing, fakeAttachment] };
        collection[idx] = updated;
        saveData(collectionUrl, collection);
        return makeResponse(updated);
      }
    }
    return makeResponse({ success: true, attachments: [] });
  }

  if (subAction === "responses") {
    // Add a response to an RFI or similar
    const body = (() => {
      try {
        if (init?.body && typeof init.body === "string") return JSON.parse(init.body) as Record<string, unknown>;
      } catch {}
      return {} as Record<string, unknown>;
    })();
    const newResponse: Record<string, unknown> = {
      id: crypto.randomUUID(),
      ...body,
      created_at: new Date().toISOString(),
    };
    if (itemId) {
      const collection = toCollection(loadData(collectionUrl));
      const idx = collection.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        const item = collection[idx];
        const existing = Array.isArray(item.responses) ? item.responses : [];
        collection[idx] = { ...item, responses: [...existing, newResponse] };
        saveData(collectionUrl, collection);
      }
    }
    return makeResponse(newResponse, 201);
  }

  if (subAction === "annotations") {
    const body = (() => {
      try {
        if (init?.body && typeof init.body === "string") return JSON.parse(init.body) as Record<string, unknown>;
      } catch {}
      return {} as Record<string, unknown>;
    })();
    return makeResponse({ id: crypto.randomUUID(), ...body, created_at: new Date().toISOString() }, 201);
  }

  // notify, download, copy, upload-url, push-to-budget, ai-draft, import, accept — just acknowledge
  return makeResponse({ success: true });
}

// ─── Main interceptor ─────────────────────────────────────────────────────────

const AUTH_PATHS = new Set([
  "/api/auth/demo",
  "/api/auth/logout",
  "/api/auth/login",
  "/api/auth/signup",
]);

export function installDemoFetchInterceptor(): void {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function demoFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;

    // Only intercept same-origin /api/* calls
    let pathname: string;
    try {
      const url = new URL(urlStr, window.location.href);
      if (url.origin !== window.location.origin) return originalFetch(input, init);
      pathname = url.pathname;
    } catch {
      return originalFetch(input, init);
    }

    if (!pathname.startsWith("/api/")) return originalFetch(input, init);
    if (AUTH_PATHS.has(pathname)) return originalFetch(input, init);

    const method = ((init?.method ?? "GET") as string).toUpperCase();
    const { collectionUrl, itemId, subAction } = parseApiUrl(pathname);

    // ── GET ──────────────────────────────────────────────────────────────────
    if (method === "GET") {
      if (itemId && !subAction) {
        // Single-item GET: check collection cache first
        const cached = toCollection(loadData(collectionUrl));
        if (cached.length > 0) {
          const item = cached.find((i) => i.id === itemId);
          if (item) return makeResponse(item);
        }
      } else if (!itemId) {
        // Collection GET: return from cache if available
        const cached = loadData(collectionUrl);
        if (cached !== undefined) return makeResponse(cached);
      }

      // No cache → fetch from server and cache the result
      const res = await originalFetch(input, init);
      if (res.ok) {
        const data = await res.json();
        const targetKey = itemId ? collectionUrl : pathname;
        if (!itemId) {
          saveData(targetKey, data);
        } else {
          // Warm the collection cache with this single item if not already cached
          const existing = toCollection(loadData(collectionUrl));
          if (!existing.find((i) => i.id === itemId)) {
            existing.push(data as Record<string, unknown>);
            saveData(collectionUrl, existing);
          }
        }
        return makeResponse(data, res.status);
      }
      return res;
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (method === "POST") {
      if (subAction) {
        return handleSubAction(subAction, collectionUrl, itemId, init);
      }

      if (!itemId) {
        // Creating a new item
        const body = await parseBody(init);
        const collection = toCollection(loadData(collectionUrl));

        const numberField = detectNumberField(collection);
        const nextNumber = numberField
          ? Math.max(0, ...collection.map((i) => (typeof i[numberField] === "number" ? (i[numberField] as number) : 0))) + 1
          : undefined;

        const projectMatch = collectionUrl.match(/\/api\/projects\/([^/]+)\//);

        const newItem: Record<string, unknown> = {
          ...(projectMatch ? { project_id: projectMatch[1] } : {}),
          ...body,
          id: crypto.randomUUID(),
          created_by: "demo-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(numberField && nextNumber !== undefined ? { [numberField]: nextNumber } : {}),
        };

        collection.push(newItem);
        saveData(collectionUrl, collection);
        return makeResponse(newItem, 201);
      }
    }

    // ── PATCH / PUT ───────────────────────────────────────────────────────────
    if ((method === "PATCH" || method === "PUT") && itemId && !subAction) {
      const body = await parseBody(init);
      const collection = toCollection(loadData(collectionUrl));
      const idx = collection.findIndex((i) => i.id === itemId);

      let updated: Record<string, unknown>;
      if (idx >= 0) {
        updated = { ...collection[idx], ...body, updated_at: new Date().toISOString() };
        collection[idx] = updated;
      } else {
        updated = { id: itemId, ...body, updated_at: new Date().toISOString() };
        collection.push(updated);
      }

      saveData(collectionUrl, collection);
      return makeResponse(updated);
    }

    if ((method === "PATCH" || method === "PUT") && itemId && subAction) {
      return handleSubAction(subAction, collectionUrl, itemId, init);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (method === "DELETE" && itemId) {
      const collection = toCollection(loadData(collectionUrl));
      saveData(collectionUrl, collection.filter((i) => i.id !== itemId));
      return makeResponse({ success: true });
    }

    // Fallback: pass through to server
    return originalFetch(input, init);
  };
}
