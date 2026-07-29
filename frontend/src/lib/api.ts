export const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "https://maker-wallet-production.up.railway.app");

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function readApiPayload<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: "A API retornou uma resposta inválida.",
    } as ApiResponse<T>;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  if (response.status === 204) {
    return null as T;
  }

  const payload = await readApiPayload<T>(response);

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message || "Erro na API", response.status, payload.details);
  }

  return payload.data;
}

export async function apiFormRequest<T>(path: string, file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await readApiPayload<T>(response);

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message || "Erro no upload", response.status, payload.details);
  }

  return payload.data;
}

export function getApiAssetUrl(assetUrl?: string | null) {
  if (!assetUrl || /^(https?:|data:)/i.test(assetUrl)) return assetUrl ?? undefined;
  return import.meta.env.DEV ? assetUrl : `${apiBaseUrl}${assetUrl}`;
}
