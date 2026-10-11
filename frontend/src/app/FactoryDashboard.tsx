import { useFactoryConnection } from '../features/factory/hooks/useFactoryConnection'
import { SimulationExperience } from './SimulationExperience'

export function FactoryDashboard() {
  const factory = useFactoryConnection()
  // A new run discards navigation, guide and analysis tied to the previous run.
  return <SimulationExperience key={factory.state?.run_id ?? 'disconnected'} factory={factory} />
}
