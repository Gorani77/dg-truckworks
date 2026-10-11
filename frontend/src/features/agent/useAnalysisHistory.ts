import { useEffect, useRef, useState } from 'react'
import { getAnalysisDetail, getAnalysisHistory, getAnalysisStorage } from '../../api/analysisHistory'
import type { AnalysisHistory, AnalysisStorage, AnalysisSummary } from '../../api/analysisHistory'

export function useAnalysisHistory() {
  const [rows, setRows] = useState<AnalysisSummary[]>([])
  const [detail, setDetail] = useState<AnalysisHistory | null>(null)
  const [storage, setStorage] = useState<AnalysisStorage | null>(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => { request.current?.abort() }, [])

  async function load(runId: string | null, nextOffset = 0) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true); setError(null); setDetail(null); setRows([]); setStorage(null)
    try {
      const receivedStorage = await getAnalysisStorage(controller.signal)
      if (controller.signal.aborted) return
      setStorage(receivedStorage); setOffset(nextOffset)
      if (!receivedStorage.history_enabled) return
      const received = await getAnalysisHistory(runId, nextOffset, controller.signal)
      if (!controller.signal.aborted) setRows(received)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '분석 이력 조회 실패')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  async function select(id: string) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true); setError(null); setDetail(null)
    try {
      const received = await getAnalysisDetail(id, controller.signal)
      if (!controller.signal.aborted) setDetail(received)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '분석 상세 조회 실패')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }
  return { rows, detail, storage, offset, loading, error, load, select }
}
