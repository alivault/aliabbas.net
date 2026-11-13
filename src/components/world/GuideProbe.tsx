import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { guideArrows, isLost, publishGuide } from './guide'
import type { GuideTarget } from './guide'
import { SHEETS } from './sheets'
import { getWorld, setWorld } from './store'

/**
 * Measures, each frame, where the icons are from the camera: on screen or
 * not, and how far. It feeds the arrows of the HUD and the lost state.
 */
export default function GuideProbe() {
  const point = useMemo(() => new THREE.Vector3(), [])
  const view = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const { phase, entered, indexOpen, lost } = getWorld()
    if (phase !== 'roam' || !entered || indexOpen) {
      publishGuide([])
      if (lost) setWorld({ lost: false })
      return
    }
    const targets: Array<GuideTarget> = SHEETS.map((sheet) => {
      point.set(sheet.x, sheet.y, sheet.z)
      view.copy(point).applyMatrix4(camera.matrixWorldInverse)
      point.project(camera)
      return {
        id: sheet.id,
        title: sheet.title,
        distance: Math.hypot(
          sheet.x - camera.position.x,
          sheet.z - camera.position.z,
        ),
        viewX: view.x,
        viewZ: view.z,
        onScreen:
          view.z < 0 && Math.abs(point.x) < 0.95 && Math.abs(point.y) < 0.95,
      }
    })
    publishGuide(guideArrows(targets))
    const nowLost = isLost(targets)
    if (nowLost !== lost) setWorld({ lost: nowLost })
  })

  return null
}
