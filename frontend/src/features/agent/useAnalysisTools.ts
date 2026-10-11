import { useEffect, useRef, useState } from 'react'
import { getAnalysisTool } from '../../api/analysis'
import type { ToolName, ToolResult } from '../../api/analysis'

export function useAnalysisTools() {
  const [result, setResult] = useState<ToolResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort() }, [])

  async function query(name: ToolName, runId: string, stationId: string | null, partId: string | null) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true); setError(null); setResult(null)
    try {
      const received = await getAnalysisTool(name, runId, stationId, partId, controller.signal)
      if (!controller.signal.aborted) setResult(received)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '조회하지 못했습니다.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }
  return { result, loading, error, query }
}
