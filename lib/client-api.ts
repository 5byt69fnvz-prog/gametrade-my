export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const payload = await response.json().catch(() => ({ error: "Unexpected server response" }));
  if (!response.ok || payload.ok === false) throw new Error(payload.error || "Request failed");
  return payload.data as T;
}
