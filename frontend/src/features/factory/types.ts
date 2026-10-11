export type StationDefinition = {
  id: string
  name: string
  processSeconds: number
  capacity: number
  inputBufferCapacity: number
  description: string
  input: string
  output: string
}

export type StationSelectionProps = {
  stations: readonly StationDefinition[]
  onSelect: (id: string) => void
}

