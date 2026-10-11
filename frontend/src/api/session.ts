// One bootstrap per page, shared by the socket and all HTTP features. The
// browser handles the HttpOnly cookie; its value is never returned to React.
let preparing: Promise<void> | null = null

async function prepare(): Promise<void> {
  const response = await fetch('/api/session', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('방문자 공장을 준비하지 못했습니다. 서버 연결을 확인하세요.')
}

export function ensureVisitorSession(): Promise<void> {
  if (!preparing) {
    // Serialize first visits across tabs where Web Locks is available, so two
    // simultaneous empty-cookie bootstraps do not replace each other's cookie.
    const bootstrap = navigator.locks
      ? navigator.locks.request('truckworks-visitor-session', prepare)
      : prepare()
    preparing = bootstrap.catch((error: unknown) => {
      preparing = null
      throw error
    })
  }
  return preparing
}

export function forgetVisitorSession() {
  preparing = null
}

export async function visitorFetch(input: string, init: RequestInit): Promise<Response> {
  await ensureVisitorSession()
  init.signal?.throwIfAborted()
  const response = await fetch(input, { ...init, credentials: 'same-origin' })
  if (response.status === 401) {
    // Prepare the next request, but never replay a production/paid command.
    forgetVisitorSession()
    throw new Error('방문자 세션이 없어졌습니다. 화면을 새로고침한 뒤 다시 요청하세요.')
  }
  return response
}
