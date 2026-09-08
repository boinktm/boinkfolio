export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isTauri()) {
    const http = await import('@tauri-apps/plugin-http');
    return http.fetch(input, init);
  }
  return fetch(input, init);
}
