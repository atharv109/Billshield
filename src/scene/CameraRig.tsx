import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/useAppStore'

const SCENE_CAMERAS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  landing:        { pos: [0, 0.5, 15],  target: [0, 0, 0] },
  intake:         { pos: [0, 1.5, 13],  target: [0, 0.5, 0] },
  parsing:        { pos: [0, 1.5, 11],  target: [0, 0.5, 0] },
  reconstruction: { pos: [1, 1.5, 12],  target: [0, 0.5, -1] },
  analysis:       { pos: [0, 2, 13],    target: [0, 0.5, -1] },
  issue:          { pos: [0, 0.5, 8],   target: [0, 0, -2] },
  action:         { pos: [-3, 1.5, 11], target: [-1, 0, 0] },
  resolution:     { pos: [0, 2.5, 14],  target: [0, 0, 0] },
}

export function CameraRig() {
  const { camera } = useThree()
  const scene = useAppStore((s) => s.scene)
  const mouse = useRef({ x: 0, y: 0 })
  const smoothMouse = useRef({ x: 0, y: 0 })
  const targetPos = useRef(new THREE.Vector3(0, 0, 14))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))
  const scrollDelta = useRef(0)

  useEffect(() => {
    const cfg = SCENE_CAMERAS[scene] ?? SCENE_CAMERAS.landing
    targetPos.current.set(...cfg.pos)
    targetLook.current.set(...cfg.target)
  }, [scene])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    const onWheel = (e: WheelEvent) => {
      if (scene === 'landing') {
        scrollDelta.current = Math.max(-3, Math.min(3, e.deltaY * 0.005))
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
    }
  }, [scene])

  useFrame((_, delta) => {
    // Smooth mouse
    smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * delta * 2
    smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * delta * 2

    // Drift offset (landing scene only)
    const driftX = scene === 'landing' ? Math.sin(Date.now() * 0.0003) * 0.4 : 0
    const driftY = scene === 'landing' ? Math.sin(Date.now() * 0.0002 + 1) * 0.2 : 0

    // Mouse parallax offset
    const mouseX = smoothMouse.current.x * 0.6
    const mouseY = smoothMouse.current.y * 0.3

    // Scroll zoom
    if (scene === 'landing') {
      scrollDelta.current *= 0.92
    }

    const tp = targetPos.current
    const finalPos = new THREE.Vector3(
      tp.x + driftX + mouseX,
      tp.y + driftY + mouseY,
      tp.z + scrollDelta.current
    )

    camera.position.lerp(finalPos, delta * 1.2)

    // Smooth look-at
    currentLook.current.lerp(targetLook.current, delta * 1.4)
    camera.lookAt(currentLook.current)
  })

  return null
}
