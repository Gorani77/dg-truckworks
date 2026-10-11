// Presentation only: the server still owns process duration and completion.
// Motion targets are sampled from the received progress, never wall-clock time.
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

export function formingCellPose(progress: number, holdProcessPose: boolean) {
  if (!holdProcessPose) return { carriageX: -.7, spindleDrop: 0, jawTravel: 0 }
  const p = clamp(progress)
  // Secure 0–12%, approach 12–24%, traverse 24–76%, retract 76–90%, release 90–100%.
  const jawTravel = .2 * smooth(p / .12) * (1 - smooth((p - .9) / .1))
  const spindleDrop = .28 * smooth((p - .12) / .12) * (1 - smooth((p - .76) / .14))
  const traverse = smooth((p - .24) / .52)
  const returnHome = smooth((p - .9) / .1)
  const carriageX = -.7 + 1.4 * traverse * (1 - returnHome)
  return { carriageX, spindleDrop, jawTravel }
}
