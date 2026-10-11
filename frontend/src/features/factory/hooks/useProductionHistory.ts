import { useEffect, useRef, useState } from 'react'
import { getStorageStatus, getRunHistoryList, getRunHistory, getEventHistory, partsForSavedState } from '../../../api/history'
import type { RunHistory, RunSummary, StorageStatus } from '../../../api/history'
import type { PartState, ProductionEvent } from '../../../api/factory'

export function useProductionHistory() {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [offset, setOffset] = useState(0)
  const [detail, setDetail] = useState<RunHistory | null>(null)
  const [parts, setParts] = useState<PartState[]>([])
  const [events, setEvents] = useState<ProductionEvent[]>([])
  const [partId, setPartId] = useState<string | null>(null)
  const [hasMoreEvents, setHasMoreEvents] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRequest = useRef<AbortController | null>(null)
  const detailRequest = useRef<AbortController | null>(null)

  useEffect(() => () => { listRequest.current?.abort(); detailRequest.current?.abort() }, [])

  async function loadRuns(nextOffset = 0) {
    listRequest.current?.abort()
    detailRequest.current?.abort()
    const controller = new AbortController()
    listRequest.current = controller
    setLoading(true); setLoadingDetail(false); setError(null)
    setRuns([]); setDetail(null); setParts([]); setEvents([]); setPartId(null); setHasMoreEvents(false)
    setStatus(null)
    try {
      const receivedStatus = await getStorageStatus(controller.signal)
      if (controller.signal.aborted) return
      setStatus(receivedStatus)
      setOffset(nextOffset)
      if (!receivedStatus.enabled) return
      const receivedRuns = await getRunHistoryList(nextOffset, controller.signal)
      if (!controller.signal.aborted) setRuns(receivedRuns)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '이력 조회 실패')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  async function selectRun(runId: string) {
    if (!runId) return
    detailRequest.current?.abort()
    const controller = new AbortController()
    detailRequest.current = controller
    setLoadingDetail(true); setError(null); setDetail(null); setParts([]); setEvents([])
    setPartId(null); setHasMoreEvents(false)
    try {
      const receivedDetail = await getRunHistory(runId, controller.signal)
      const receivedEvents = await getEventHistory(runId, 0, null, controller.signal)
      if (controller.signal.aborted) return
      const visible = receivedEvents.filter((event) => event.sequence <= receivedDetail.snapshot.last_event_sequence)
      setDetail(receivedDetail); setParts(partsForSavedState(receivedDetail.snapshot)); setEvents(visible)
      setHasMoreEvents(visible.length === 100 && (visible.at(-1)?.sequence ?? 0) < receivedDetail.snapshot.last_event_sequence)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '실행 조회 실패')
    } finally {
      if (!controller.signal.aborted) setLoadingDetail(false)
    }
  }

  async function loadEvents(nextPartId: string | null, append = false) {
    if (!detail || loadingDetail) return
    detailRequest.current?.abort()
    const controller = new AbortController()
    detailRequest.current = controller
    const after = append ? events.at(-1)?.sequence ?? 0 : 0
    setPartId(nextPartId); setLoadingDetail(true); setError(null)
    if (!append) { setEvents([]); setHasMoreEvents(false) }
    try {
      const received = await getEventHistory(detail.run_id, after, nextPartId, controller.signal)
      if (controller.signal.aborted) return
      const visible = received.filter((event) => event.sequence <= detail.snapshot.last_event_sequence)
      setEvents((previous) => append ? [...previous, ...visible] : visible)
      setHasMoreEvents(visible.length === 100 && (visible.at(-1)?.sequence ?? 0) < detail.snapshot.last_event_sequence)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '이벤트 조회 실패')
    } finally {
      if (!controller.signal.aborted) setLoadingDetail(false)
    }
  }

  return { status, runs, offset, detail, parts, events, partId, hasMoreEvents, loading, loadingDetail, error,
    loadRuns, selectRun, loadEvents }
}
