export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, unknown> = {}) { super(message); }
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers }, signal: init?.signal ?? AbortSignal.timeout(30000) }); }
  catch { throw new ApiError(0, "NETWORK_ERROR", "No pudimos conectar con NutriPlan. Comprueba tu conexión y vuelve a intentarlo."); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.code ?? data.error ?? "REQUEST_FAILED", data.message ?? "No pudimos completar la operación.", data);
  return data as T;
}
