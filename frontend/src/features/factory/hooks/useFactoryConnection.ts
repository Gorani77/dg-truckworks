import { useEffect, useRef, useState } from 'react'
import { startSinglePart, startBatch, pauseFactory, resumeFactory, resetFactory, faultStation, repairStation } from '../../../api/factory'
import type { FactoryState, ProductionEvent } from '../../../api/factory'
import { factoryStreamUrl, readFactoryFrame } from '../../../api/factoryStream'
import { ensureVisitorSession, forgetVisitorSession, SessionPreparationError } from '../../../api/session'

const STARTUP_SECONDS = 100

export function useFactoryConnection() {
  const [state, setState] = useState<FactoryState | null>(null)
  const [events, setEvents] = useState<ProductionEvent[]>([])
  const [connection, setConnection] = useState<'loading' | 'connected' | 'offline'>('loading')
  const [startupSeconds, setStartupSeconds] = useState<number | null>(STARTUP_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const [commandError, setCommandError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const command = useRef<AbortController | null>(null)

  useEffect(() => () => command.current?.abort(), [])

  useEffect(() => {
    let active = true
    let socket: WebSocket | undefined
    let retry: ReturnType<typeof setTimeout> | undefined
    let watchdog: ReturnType<typeof setTimeout> | undefined
    let delay = 1500
    let hasConnected = false
    let startupRejected = false
    const startupDeadline = Date.now() + STARTUP_SECONDS * 1000
    const startupTimer = setInterval(() => {
      if (!active || hasConnected || startupRejected) return
      const remaining = Math.max(0, Math.ceil((startupDeadline - Date.now()) / 1000))
      setStartupSeconds(remaining)
      if (remaining === 0) {
        clearInterval(startupTimer)
        setConnection('offline')
      }
    }, 1000)

    function reportConnectionFailure(message: string) {
      if (!hasConnected && !startupRejected) {
        const remaining = Math.max(0, Math.ceil((startupDeadline - Date.now()) / 1000))
        setStartupSeconds(remaining)
        setConnection(remaining > 0 ? 'loading' : 'offline')
        setError(null)
        return
      }
      setConnection('offline')
      setError(message)
    }

    async function connect() {
      if (!active) return
      try {
        await ensureVisitorSession()
      } catch (cause) {
        if (!active) return
        setState(null)
        setEvents([])
        // Explicit rejection isn't a normal server cold start.
        if (cause instanceof SessionPreparationError && cause.status !== 408 && cause.status !== 429) {
          startupRejected = true
          clearInterval(startupTimer)
          setStartupSeconds(null)
        }
        reportConnectionFailure(cause instanceof Error ? cause.message : '방문자 공장을 준비하지 못했습니다.')
        retry = setTimeout(() => { void connect() }, delay)
        delay = Math.min(delay * 2, 10000)
        return
      }
      if (!active) return
      const current = new WebSocket(factoryStreamUrl())
      socket = current
      let disconnected = false
      let lastVersion = -1
      let lastRun: string | undefined

      function loseConnection() {
        if (!active || disconnected || socket !== current) return
        disconnected = true
        clearTimeout(watchdog)
        setState(null)
        setEvents([])
        reportConnectionFailure('실시간 연결이 끊겼습니다. 서버 상태를 확인하세요. 자동으로 다시 연결합니다.')
        forgetVisitorSession()
        current.close()
        retry = setTimeout(() => { void connect() }, delay)
        delay = Math.min(delay * 2, 10000)
      }

      function armWatchdog() {
        clearTimeout(watchdog)
        watchdog = setTimeout(loseConnection, 15000)
      }

      armWatchdog()
      current.onmessage = (message) => {
        if (!active || disconnected || socket !== current) return
        try {
          const frame = readFactoryFrame(message.data)
          armWatchdog()
          if (frame.type === 'heartbeat') return
          const snapshot = frame.state
          if (snapshot.run_id === lastRun && snapshot.state_version < lastVersion) return
          lastRun = snapshot.run_id
          lastVersion = snapshot.state_version
          setState(snapshot)
          setEvents(frame.events.filter((event) =>
            event.run_id === snapshot.run_id && event.sequence <= snapshot.last_event_sequence))
          delay = 1500
          hasConnected = true
          clearInterval(startupTimer)
          setStartupSeconds(null)
          setConnection('connected')
          setError(null)
        } catch {
          loseConnection()
        }
      }
      current.onerror = loseConnection
      current.onclose = loseConnection
    }
    void connect()
    return () => {
      active = false
      clearInterval(startupTimer)
      clearTimeout(retry)
      clearTimeout(watchdog)
      socket?.close()
    }
  }, [])

  async function execute(action: 'start' | 'pause' | 'resume' | 'reset' | 'fault' | 'repair', batch = false, stationId?: string) {
    if (!state || connection !== 'connected' || command.current) return
    if (action === 'start' && state.run_status !== 'READY') return
    if (action === 'pause' && state.run_status !== 'RUNNING') return
    if (action === 'resume' && (state.run_status !== 'PAUSED' || !state.can_resume)) return
    const station = state.stations.find((item) => item.definition.id === stationId)
    if (action === 'fault' && (!station || station.status === 'FAULTED'
      || (state.run_status !== 'RUNNING' && !state.can_resume))) return
    if (action === 'repair' && (!station || station.status !== 'FAULTED')) return
    const controller = new AbortController()
    command.current = controller
    setSending(true)
    setCommandError(null)
    try {
      const send = {
        start: batch ? startBatch : startSinglePart, pause: pauseFactory, resume: resumeFactory, reset: resetFactory,
        fault: (runId: string, signal: AbortSignal) => faultStation(runId, stationId!, signal),
        repair: (runId: string, signal: AbortSignal) => repairStation(runId, stationId!, signal),
      }[action]
      // The stream owns displayed state. A late HTTP response must not replace
      // a newer streamed snapshot or restore a run that has already been reset.
      await send(state.run_id, controller.signal)
    } catch (cause) {
      if (controller.signal.aborted) return
      setCommandError(cause instanceof Error ? cause.message : '생산 제어 요청에 실패했습니다.')
    } finally {
      command.current = null
      if (!controller.signal.aborted) setSending(false)
    }
  }

  return { state, events, connection, startupSeconds, error, commandError, sending,
    start: (batch = false) => execute('start', batch), pause: () => execute('pause'),
    resume: () => execute('resume'), reset: () => execute('reset'),
    fault: (stationId: string) => execute('fault', false, stationId),
    repair: (stationId: string) => execute('repair', false, stationId) }
}
