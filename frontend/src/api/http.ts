let accessToken: string | null = null;

export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Opts = { method?: string; body?: unknown; skipRefresh?: boolean };

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        accessToken = data.accessToken ?? null;
        return !!accessToken;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function http<T>(path: string, opts: Opts = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !opts.skipRefresh) {
    if (await tryRefresh())
      return http<T>(path, { ...opts, skipRefresh: true });
  }

  if (!res.ok) {
    let msg = "Có lỗi xảy ra, vui lòng thử lại.";
    try {
      const data = await res.json();
      msg = Array.isArray(data.message)
        ? data.message[0]
        : (data.message ?? msg);
    } catch {
      /* body rỗng */
    }
    throw new ApiError(res.status, msg);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}
