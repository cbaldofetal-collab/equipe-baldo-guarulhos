const getApiUrl = (): string => {
  const envVar = import.meta.env.VITE_API_URL as string | undefined;
  if (envVar) {
    console.log('[uFetal] API URL from env:', envVar);
    return envVar;
  }
  if (typeof window !== 'undefined') {
    console.log('[uFetal] API URL from window.location:', window.location.origin);
    return window.location.origin;
  }
  return 'http://localhost:5173';
};

export const API_URL = getApiUrl();

export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  console.log('[uFetal] Fetching:', url);
  return fetch(url, options);
}
