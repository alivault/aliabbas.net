import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.z = 7.5

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const particlePositions: number[] = []
    const particleColors: number[] = []
    const gridSize = 15
    const cubeSize = 2.6
    const step = cubeSize / (gridSize - 1)
    const color = new THREE.Color('#d9ff43')
    const accent = new THREE.Color('#8da4ff')

    for (let x = 0; x < gridSize; x += 1) {
      for (let y = 0; y < gridSize; y += 1) {
        for (let z = 0; z < gridSize; z += 1) {
          const isOnSurface =
            x === 0 ||
            x === gridSize - 1 ||
            y === 0 ||
            y === gridSize - 1 ||
            z === 0 ||
            z === gridSize - 1

          if (!isOnSurface) continue

          particlePositions.push(
            x * step - cubeSize / 2,
            y * step - cubeSize / 2,
            z * step - cubeSize / 2,
          )

          const particleColor = color
            .clone()
            .lerp(accent, (z / gridSize) * 0.35)
          particleColors.push(particleColor.r, particleColor.g, particleColor.b)
        }
      }
    }

    const cubePositions = new Float32Array(particlePositions)
    const particleCount = cubePositions.length / 3
    const spherePositions = new Float32Array(particleCount * 3)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    const sphereRadius = 1.45

    for (let index = 0; index < particleCount; index += 1) {
      const normalizedY = 1 - (index / (particleCount - 1)) * 2
      const horizontalRadius = Math.sqrt(1 - normalizedY * normalizedY)
      const angle = goldenAngle * index
      const offset = index * 3
      spherePositions[offset] =
        Math.cos(angle) * horizontalRadius * sphereRadius
      spherePositions[offset + 1] = normalizedY * sphereRadius
      spherePositions[offset + 2] =
        Math.sin(angle) * horizontalRadius * sphereRadius
    }

    const geometry = new THREE.BufferGeometry()
    const positionAttribute = new THREE.Float32BufferAttribute(
      cubePositions.slice(),
      3,
    )
    geometry.setAttribute('position', positionAttribute)
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(particleColors, 3),
    )

    const material = new THREE.PointsMaterial({
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
    })
    const cube = new THREE.Points(geometry, material)
    cube.rotation.set(-0.35, 0.55, 0.08)
    scene.add(cube)

    const clock = new THREE.Clock()
    let isDragging = false
    let morphProgress = 0
    let morphTarget = 0
    let lastPointerX = 0
    let lastPointerY = 0
    let isVisible = true
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true
    })
    intersectionObserver.observe(canvas)

    const handlePointerDown = (event: PointerEvent) => {
      isDragging = true
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      canvas.setPointerCapture(event.pointerId)
    }

    const handlePointerEnter = () => {
      morphTarget = 1
    }

    const handlePointerLeave = () => {
      morphTarget = 0
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      cube.rotation.y += (event.clientX - lastPointerX) * 0.008
      cube.rotation.x += (event.clientY - lastPointerY) * 0.008
      lastPointerX = event.clientX
      lastPointerY = event.clientY
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging = false
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerenter', handlePointerEnter)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05)
      if (!isVisible) return

      if (Math.abs(morphProgress - morphTarget) > 0.001) {
        const morphDamping = 1 - Math.exp(-4.03 * delta)
        morphProgress = THREE.MathUtils.lerp(
          morphProgress,
          morphTarget,
          morphDamping,
        )
        const easedMorph = THREE.MathUtils.smoothstep(morphProgress, 0, 1)

        for (let index = 0; index < positionAttribute.count; index += 1) {
          const offset = index * 3
          positionAttribute.array[offset] = THREE.MathUtils.lerp(
            cubePositions[offset] ?? 0,
            spherePositions[offset] ?? 0,
            easedMorph,
          )
          positionAttribute.array[offset + 1] = THREE.MathUtils.lerp(
            cubePositions[offset + 1] ?? 0,
            spherePositions[offset + 1] ?? 0,
            easedMorph,
          )
          positionAttribute.array[offset + 2] = THREE.MathUtils.lerp(
            cubePositions[offset + 2] ?? 0,
            spherePositions[offset + 2] ?? 0,
            easedMorph,
          )
        }
        positionAttribute.needsUpdate = true
      }

      if (!isDragging && !reduceMotion) {
        cube.rotation.y += 0.132 * delta
        cube.rotation.x += 0.036 * delta
      }
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerenter', handlePointerEnter)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="product-model mx-auto mt-4 max-w-[250px] sm:max-w-[300px] lg:mt-0 lg:max-w-none">
      <canvas
        ref={canvasRef}
        className="product-model-canvas"
        aria-label="A rotating particle cube that becomes a sphere on hover. Drag to rotate it."
        role="img"
      />
    </div>
  )
}
