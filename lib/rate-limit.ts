interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { windowSeconds: 60, maxRequests: 30 };

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: true } | { allowed: false; retryAfter: number } {
  const { windowSeconds, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

export function rateLimitKey(request: Request, prefix: string = "api"): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const url = new URL(request.url);
  return ${prefix}::;
}