// Keep local Vite proxying when no deployment origin is configured.
export function apiUrl(path: string): URL {
  const origin = import.meta.env.VITE_API_ORIGIN?.trim() || window.location.origin
  return new URL(path, origin)
}

export function sessionPrepareTimeout(): number {
  return import.meta.env.VITE_API_ORIGIN?.trim() ? 120000 : 5000
}
