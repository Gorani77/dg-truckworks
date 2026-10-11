import { FactoryLayoutPreview } from './FactoryLayoutPreview'
import { lazy, Suspense, useState } from 'react'
import { SceneBoundary } from './SceneBoundary'
import { Button } from '../components/Button'
import { chassisLine } from '../features/factory/data/chassisLine'
import type { StationSelectionProps } from '../features/factory/types'
import styles from './scene.module.css'
import type { FactoryState, PartState, StationState, TransferState } from '../api/factory'

const FactoryScene = lazy(() => import('./FactoryScene'))

type FactoryViewportProps = StationSelectionProps & {
  selectedId: string
  configuration?: FactoryState['configuration']
  stationStates?: readonly StationState[]
  parts?: readonly PartState[]
  transfers?: readonly TransferState[]
  runId?: string
}

export function FactoryViewport(props: FactoryViewportProps) {
  const [show3D, setShow3D] = useState(true)
  const [resetView, setResetView] = useState(0)
  const dimensions = props.configuration?.chassis_dimensions_mm ?? chassisLine.chassisDimensionsMm
  const { length, width, height } = dimensions
  const fallback = <div>
    <p className={styles.viewportNote} role="status">3D 장면을 표시할 수 없어 2D 배치도를 보여줍니다. 공정 선택과 서버 상태는 계속 사용할 수 있습니다.</p>
    <FactoryLayoutPreview {...props} />
  </div>
  return (
    <section className={styles.viewport} aria-label="공장 작업 영역">
      <header className={styles.toolbar}>
        <h2>공장 작업 영역</h2>
        <div className={styles.viewControls}>
          {show3D && <Button onClick={() => setResetView((value) => value + 1)}>시점 초기화</Button>}
          <Button onClick={() => setShow3D((value) => !value)}>{show3D ? '2D 배치도 보기' : '3D 장면 보기'}</Button>
        </div>
      </header>
      {show3D ? <SceneBoundary fallback={fallback}>
        <Suspense fallback={<div><p className={styles.viewportNote} role="status">3D 장면을 불러오는 중입니다.</p><FactoryLayoutPreview {...props} /></div>}>
          <div className={styles.canvasContainer} role="region" aria-label="3D 공장. 설비 클릭으로 선택, 좌클릭 드래그로 이동, 우클릭 드래그로 회전, 휠로 확대. 키보드 선택은 좌측 공정 목록을 사용하세요.">
            <FactoryScene {...props} dimensions={dimensions} resetView={resetView} fallback={fallback} />
          </div>
        </Suspense>
      </SceneBoundary> : <FactoryLayoutPreview {...props} />}
      <div className={styles.viewportNote}>설비를 클릭하면 상세 정보를 볼 수 있습니다. 좌클릭 드래그로 이동, 우클릭 드래그로 회전·휠로 확대하며, 시점 초기화로 돌아옵니다. 상태 수신 전에는 소재를 표시하지 않습니다.</div>
      <dl className={styles.specification}>
        <div><dt>제품</dt><dd>3축 견인차 프레임</dd></div>
        <div><dt>차체 크기</dt><dd>{length} × {width} × {height} mm</dd></div>
        <div><dt>초기 소재 설정</dt><dd>{props.configuration?.initial_material_count ?? chassisLine.materialCount}개 / 실행</dd></div>
      </dl>
    </section>
  )
}


