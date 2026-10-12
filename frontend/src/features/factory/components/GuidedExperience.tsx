import type { FactoryState } from '../../../api/factory'
import type { TourStep } from '../hooks/useGuidedTour'
import styles from '../experience.module.css'

const steps = {
  produce: ['01', '차체 생산하기', '생산을 시작하고 소재가 가공기로 이동하는 모습을 살펴보세요.', '20개 생산 시작'],
  fault: ['02', '설비 고장 내기', '공장 환경에서 ST-02 형상 가공기를 선택하고 고장을 발생시키세요. 앞뒤 공정의 변화도 관찰하세요.', '공장 환경 열기'],
  analyze: ['03', '고장 원인 분석하기', 'AI 창에서 분석을 요청하세요. 실제 답변에 포함된 관련 설비가 장면 위에 강조됩니다.', 'AI 분석 열기'],
  repair: ['04', '설비 복구하기', '공장 환경에서 ST-02를 복구하세요. 일시정지했다면 같은 메뉴의 생산 제어에서 재개하세요.', '공장 환경 열기'],
  complete: ['05', '안내가 끝났습니다', '생산·고장·분석·복구 흐름을 체험했습니다. 부품을 선택해 이동을 따라가거나 다른 설비를 살펴보세요.', '안내 마치기'],
}

export function GuidedExperience({ step, state, sending, onAction, onEnd }: {
  step: Exclude<TourStep, 'off'>; state: FactoryState | null; sending: boolean; onAction: () => void; onEnd: () => void
}) {
  const [number, title, description, action] = steps[step]
  const station = state?.stations.find((item) => item.definition.id === 'ST-02')
  const canAct = step !== 'produce' || state?.run_status === 'READY'
  return <section className={styles.guide} aria-label="안내 체험">
    <div className={styles.guideHeading}><span>안내 체험 / {number} — 05</span><button onClick={onEnd}>안내 종료</button></div>
    <div className={styles.guideSteps} aria-label={`안내 체험 ${number} / 5 단계`}>
      {['생산', '고장', '분석', '복구', '완료'].map((label, index) => <span key={label} data-reached={index < Number(number)} aria-current={index + 1 === Number(number) ? 'step' : undefined}><i />{label}</span>)}
    </div>
    <h2>{title}</h2><p>{description}</p>
    {step === 'fault' && station?.status !== 'PROCESSING' && <p className={styles.note}>가공기에 소재가 들어오기를 기다리세요. 일시정지 상태라면 하단에서 재개하세요.</p>}
    {state?.run_status === 'COMPLETED' && (step === 'produce' || step === 'fault') && <p className={styles.note}>생산이 끝났습니다. 안내를 종료하고 공장 환경에서 초기화한 뒤 다시 체험하세요.</p>}
    <button className={styles.primary} disabled={!canAct || sending || !state} onClick={onAction}>
      {action}
    </button>
  </section>
}

