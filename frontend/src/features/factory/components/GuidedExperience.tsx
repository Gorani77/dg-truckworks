import type { FactoryState } from '../../../api/factory'
import type { TourStep } from '../hooks/useGuidedTour'
import styles from '../experience.module.css'

const steps = {
  produce: ['01', '소재에서 차체로', '생산을 시작하고 소재가 가공기로 이동하는 모습을 살펴보세요.', '20개 생산 시작'],
  fault: ['02', '흐름을 멈춰보세요', '형상 가공기에 소재가 들어오면 고장을 발생시켜 보세요. 앞뒤 공정의 변화도 관찰하세요.', '가공기 고장 발생'],
  analyze: ['03', 'AI에게 이유를 물어보세요', 'AI 창에서 분석을 요청하세요. 실제 답변에 포함된 관련 설비가 장면 위에 강조됩니다.', 'AI 분석 열기'],
  repair: ['04', '생산 흐름을 되살리세요', '분석 근거를 살펴본 뒤 설비를 복구하세요. 일시정지했다면 생산도 재개하세요.', '가공기 복구'],
  complete: ['05', '이제 자유롭게 탐색하세요', '생산·고장·분석·복구 흐름을 체험했습니다. 부품을 선택해 이동을 따라가거나 다른 설비를 살펴보세요.', '자유 탐색으로'],
}

export function GuidedExperience({ step, state, sending, onAction, onEnd }: {
  step: Exclude<TourStep, 'off'>; state: FactoryState | null; sending: boolean; onAction: () => void; onEnd: () => void
}) {
  const [number, title, description, action] = steps[step]
  const station = state?.stations.find((item) => item.definition.id === 'ST-02')
  const canAct = step === 'complete' || step === 'analyze' || Boolean(state && (
    step === 'produce' ? state.run_status === 'READY'
      : step === 'fault' ? state.run_status === 'RUNNING' && station?.status === 'PROCESSING'
        : station?.status === 'FAULTED' || state.can_resume))
  return <section className={styles.guide} aria-label="안내 체험">
    <div className={styles.guideHeading}><span>안내 체험 / {number} — 05</span><button onClick={onEnd}>안내 종료</button></div>
    <div className={styles.guideSteps} aria-label={`안내 체험 ${number} / 5 단계`}>
      {['생산', '고장', '분석', '복구', '완료'].map((label, index) => <span key={label} data-reached={index < Number(number)} aria-current={index + 1 === Number(number) ? 'step' : undefined}><i />{label}</span>)}
    </div>
    <h2>{title}</h2><p>{description}</p>
    {step === 'fault' && station?.status !== 'PROCESSING' && <p className={styles.note}>가공기에 소재가 들어오기를 기다리세요. 일시정지 상태라면 하단에서 재개하세요.</p>}
    {state?.run_status === 'COMPLETED' && (step === 'produce' || step === 'fault') && <p className={styles.note}>생산이 끝났습니다. 안내를 종료하고 생산 설정에서 초기화한 뒤 다시 체험하세요.</p>}
    <button className={styles.primary} disabled={!canAct || sending || !state} onClick={onAction}>
      {step === 'repair' && station?.status !== 'FAULTED' && state?.can_resume ? '생산 재개' : action}
    </button>
  </section>
}

