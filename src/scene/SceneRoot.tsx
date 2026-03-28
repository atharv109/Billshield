import { Suspense } from 'react'
import { SceneEnvironment } from './Environment'
import { CameraRig } from './CameraRig'
import { AmbientParticles } from './AmbientParticles'
import { BillStorm } from './BillStorm'
import { IntakePortal } from './IntakePortal'
import { CaseConstellation } from './CaseConstellation'

export function SceneRoot() {
  return (
    <Suspense fallback={null}>
      <SceneEnvironment />
      <CameraRig />
      <AmbientParticles />
      <BillStorm />
      <IntakePortal />
      <CaseConstellation />
    </Suspense>
  )
}
