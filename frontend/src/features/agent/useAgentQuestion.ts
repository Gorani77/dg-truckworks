import { useEffect, useRef, useState } from 'react'
import type { AgentAnswer } from '../../api/analysis'
import { visitorFetch } from '../../api/session'

export function useAgentQuestion() {
  const [answer, setAnswer] = useState<AgentAnswer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyState, setHistoryState] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort() }, [])

  async function ask(question: string, runId: string, stationId?: string) {
    if (loading || !question.trim()) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true); setError(null); setAnswer(null); setHistoryState(null)
    try {
      const response = await visitorFetch('/api/analysis/questions', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), expected_run_id: runId, station_id: stationId }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(40000)]), cache: 'no-store',
      })
      if (controller.signal.aborted) return
      setHistoryState(response.headers.get('X-Analysis-History'))
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: unknown } | null
        const id = response.headers.get('X-Analysis-ID')
        throw new Error((typeof body?.detail === 'string' ? body.detail : `분석 요청 실패 (${response.status})`)
          + (id ? ` 분석 ID: ${id}` : ''))
      }
      const received = await response.json() as AgentAnswer
      if (!controller.signal.aborted) setAnswer(received)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '분석 요청에 실패했습니다.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }
  return { answer, loading, error, historyState, ask }
}
