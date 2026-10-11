import { useState } from 'react'
import type { StationDefinition } from '../types'

export function useStationSelection(stations: readonly StationDefinition[]) {
  const initialStation = stations[1] ?? stations[0]
  const [selectedId, setSelectedId] = useState(initialStation?.id ?? '')
  if (!initialStation) {
    throw new Error('생산라인에는 최소 하나의 공정이 필요합니다.')
  }
  const selectedStation = stations.find((station) => station.id === selectedId) ?? initialStation

  function selectStation(id: string) {
    if (stations.some((station) => station.id === id)) setSelectedId(id)
  }

  return { selectedStation, selectStation }
}

