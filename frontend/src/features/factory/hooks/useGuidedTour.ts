import { useEffect, useReducer } from 'react'
import type { FactoryState } from '../../../api/factory'
import type { AgentAnswer } from '../../../api/analysis'

export type TourStep = 'off' | 'produce' | 'fault' | 'analyze' | 'repair' | 'complete'
type Tour = { step: TourStep; faultVersion: number }
type Action = { type: 'begin' | 'end' } | { type: 'observe'; state: FactoryState | null; answer: AgentAnswer | null }

function reduceTour(tour: Tour, action: Action): Tour {
  if (action.type === 'begin') return { step: 'produce', faultVersion: -1 }
  if (action.type === 'end') return { step: 'off', faultVersion: -1 }
  if (action.type !== 'observe' || !action.state) return tour
  const { state, answer } = action
  const station = state.stations.find((item) => item.definition.id === 'ST-02')
  if (tour.step === 'produce' && state.run_status === 'RUNNING') return { ...tour, step: 'fault' }
  if (tour.step === 'fault' && station?.status === 'FAULTED') return { step: 'analyze', faultVersion: state.state_version }
  if (tour.step === 'analyze' && answer?.run_id === state.run_id && answer.state_version >= tour.faultVersion) {
    return { ...tour, step: 'repair' }
  }
  if (tour.step === 'repair' && station && station.status !== 'FAULTED'
    && (state.run_status === 'RUNNING' || state.run_status === 'COMPLETED')) return { ...tour, step: 'complete' }
  return tour
}

export function useGuidedTour(state: FactoryState | null, answer: AgentAnswer | null) {
  const [tour, dispatch] = useReducer(reduceTour, { step: 'off', faultVersion: -1 })
  useEffect(() => { dispatch({ type: 'observe', state, answer }) }, [state, answer, tour.step])
  return { step: tour.step, begin: () => dispatch({ type: 'begin' }), end: () => dispatch({ type: 'end' }) }
}
