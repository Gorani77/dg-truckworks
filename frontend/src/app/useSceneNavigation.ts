import { useEffect, useState } from 'react'
import type { SpatialFocus } from '../scene/spatialNavigation'
import type { ScenePanel } from './SimulationHud'

export function useSceneNavigation() {
  const [focus, setFocus] = useState<SpatialFocus>({ kind: 'overview' })
  const [panel, setPanel] = useState<ScenePanel>(null)
  const [resetView, setResetView] = useState(0)
  const [show2D, setShow2D] = useState(false)
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (panel) setPanel(null)
        else { setFocus({ kind: 'overview' }); setResetView((value) => value + 1) }
      }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [panel])
  return { focus, panel, resetView, show2D, setPanel,
    navigate: (next: SpatialFocus) => setFocus(next),
    resetCamera: () => { setFocus({ kind: 'overview' }); setResetView((value) => value + 1) },
    toggle2D: () => setShow2D((value) => !value) }
}
