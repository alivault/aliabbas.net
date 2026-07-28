import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'

type GridPoint = [number, number, number]

type PlaneTracer = {
  path: Array<THREE.Vector3>
  planeIndex: number
  progress: number
  speed: number
  delay: number
  trailPositions: Float32Array
  trailAttribute: THREE.BufferAttribute
  trailGeometry: THREE.BufferGeometry
  trailMaterial: THREE.ShaderMaterial
  headPositions: Float32Array
  headAttribute: THREE.BufferAttribute
  headGeometry: THREE.BufferGeometry
  headMaterial: THREE.PointsMaterial
  samplePoint: THREE.Vector3
}

function createTracerPath(
  gridSize: number,
  planeCount: number,
  gridStep: number,
  planeStep: number,
  cubeSize: number,
) {
  const plane = Math.floor(Math.random() * planeCount)
  const startEdge = Math.floor(Math.random() * 4)
  const targetEdgeOffset = 1 + Math.floor(Math.random() * 3)
  const targetEdge = (startEdge + targetEdgeOffset) % 4

  const createEdgePoint = (edge: number): GridPoint => {
    const freeCoordinate = 1 + Math.floor(Math.random() * (gridSize - 2))
    if (edge === 0) return [0, plane, freeCoordinate]
    if (edge === 1) return [gridSize - 1, plane, freeCoordinate]
    if (edge === 2) return [freeCoordinate, plane, 0]
    return [freeCoordinate, plane, gridSize - 1]
  }

  const current = createEdgePoint(startEdge)
  const target = createEdgePoint(targetEdge)
  const path = [
    new THREE.Vector3(
      current[0] * gridStep - cubeSize / 2,
      current[1] * planeStep - cubeSize / 2,
      current[2] * gridStep - cubeSize / 2,
    ),
  ]

  while (current.some((coordinate, axis) => coordinate !== target[axis])) {
    const availableAxes = ([0, 2] as const).filter(
      (axis) => current[axis] !== target[axis],
    )
    const axis =
      availableAxes[Math.floor(Math.random() * availableAxes.length)] ?? 0
    current[axis] += Math.sign(target[axis] - current[axis])
    path.push(
      new THREE.Vector3(
        current[0] * gridStep - cubeSize / 2,
        current[1] * planeStep - cubeSize / 2,
        current[2] * gridStep - cubeSize / 2,
      ),
    )
  }

  return { path, planeIndex: plane }
}

function sampleTracerPath(
  path: Array<THREE.Vector3>,
  progress: number,
  target: THREE.Vector3,
) {
  const scaledProgress =
    THREE.MathUtils.clamp(progress, 0, 1) * (path.length - 1)
  const index = Math.min(Math.floor(scaledProgress), path.length - 2)
  return target.lerpVectors(
    path[index] ?? path[0] ?? target,
    path[index + 1] ?? path.at(-1) ?? target,
    scaledProgress - index,
  )
}

export default function ParticleModel({
  heroRef,
}: {
  heroRef: RefObject<HTMLElement | null>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const interactionTarget = heroRef.current ?? container

    const scene = new THREE.Scene()
    const baseCameraDistance = 5.2
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.z = baseCameraDistance

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const gridPositions: number[] = []
    const gridColors: number[] = []
    const gridSize = 15
    const planeCount = 9
    const cubeSize = 2.6
    const gridStep = cubeSize / (gridSize - 1)
    const planeStep = cubeSize / (planeCount - 1)
    const color = new THREE.Color('#d9ff43')
    const accent = new THREE.Color('#8da4ff')

    for (let plane = 0; plane < planeCount; plane += 1) {
      const y = plane * planeStep - cubeSize / 2
      const planeColor = color
        .clone()
        .lerp(accent, (plane / (planeCount - 1)) * 0.45)

      for (let line = 0; line < gridSize; line += 1) {
        const coordinate = line * gridStep - cubeSize / 2
        gridPositions.push(
          -cubeSize / 2,
          y,
          coordinate,
          cubeSize / 2,
          y,
          coordinate,
          coordinate,
          y,
          -cubeSize / 2,
          coordinate,
          y,
          cubeSize / 2,
        )

        for (let vertex = 0; vertex < 4; vertex += 1) {
          gridColors.push(planeColor.r, planeColor.g, planeColor.b)
        }
      }
    }

    const baseGridPositions = new Float32Array(gridPositions)
    const gridPositionAttribute = new THREE.Float32BufferAttribute(
      baseGridPositions.slice(),
      3,
    )
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', gridPositionAttribute)
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(gridColors, 3),
    )

    const material = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.28,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const planeStack = new THREE.LineSegments(geometry, material)
    planeStack.rotation.set(-0.35, 0.55, 0.08)
    scene.add(planeStack)

    const planeGeometry = new THREE.PlaneGeometry(cubeSize, cubeSize)
    const planeMeshes: Array<THREE.Mesh> = []
    const planeMaterials = Array.from({ length: planeCount }, (_, index) => {
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: color.clone().lerp(accent, (index / (planeCount - 1)) * 0.45),
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.position.y = index * planeStep - cubeSize / 2
      plane.rotation.x = -Math.PI / 2
      planeStack.add(plane)
      planeMeshes.push(plane)
      return planeMaterial
    })

    const tracerGroup = new THREE.Group()
    const tracerColors = [
      '#d9ff43',
      '#8da4ff',
      '#ffffff',
      '#d9ff43',
      '#8da4ff',
      '#d9ff43',
      '#ffffff',
      '#8da4ff',
    ] as const
    const trailPointCount = 24
    const tracers = tracerColors.map((tracerColor, index): PlaneTracer => {
      const tracerPath = createTracerPath(
        gridSize,
        planeCount,
        gridStep,
        planeStep,
        cubeSize,
      )
      const trailPositions = new Float32Array(trailPointCount * 3)
      const trailAttribute = new THREE.BufferAttribute(trailPositions, 3)
      const trailGeometry = new THREE.BufferGeometry()
      trailGeometry.setAttribute('position', trailAttribute)
      const trailAlphas = new Float32Array(trailPointCount)
      for (let point = 0; point < trailPointCount; point += 1) {
        const progress = point / (trailPointCount - 1)
        trailAlphas[point] = THREE.MathUtils.smoothstep(progress, 0, 0.55)
      }
      trailGeometry.setAttribute(
        'aAlpha',
        new THREE.BufferAttribute(trailAlphas, 1),
      )
      const trailMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(tracerColor) },
          uOpacity: { value: 0 },
        },
        vertexShader: `
          attribute float aAlpha;
          varying float vAlpha;

          void main() {
            vAlpha = aAlpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vAlpha;

          void main() {
            gl_FragColor = vec4(uColor, vAlpha * uOpacity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const trail = new THREE.Line(trailGeometry, trailMaterial)

      const headPositions = new Float32Array(3)
      const headAttribute = new THREE.BufferAttribute(headPositions, 3)
      const headGeometry = new THREE.BufferGeometry()
      headGeometry.setAttribute('position', headAttribute)
      const headMaterial = new THREE.PointsMaterial({
        color: tracerColor,
        size: 0.11,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const head = new THREE.Points(headGeometry, headMaterial)

      tracerGroup.add(trail, head)

      return {
        path: tracerPath.path,
        planeIndex: tracerPath.planeIndex,
        progress: 0,
        speed: 0.14 + Math.random() * 0.12,
        delay: index * 0.3 + Math.random() * 2,
        trailPositions,
        trailAttribute,
        trailGeometry,
        trailMaterial,
        headPositions,
        headAttribute,
        headGeometry,
        headMaterial,
        samplePoint: new THREE.Vector3(),
      }
    })
    planeStack.add(tracerGroup)

    const resetTracer = (tracer: PlaneTracer) => {
      const tracerPath = createTracerPath(
        gridSize,
        planeCount,
        gridStep,
        planeStep,
        cubeSize,
      )
      tracer.path = tracerPath.path
      tracer.planeIndex = tracerPath.planeIndex
      tracer.progress = 0
      tracer.speed = 0.14 + Math.random() * 0.12
      tracer.delay = 0.5 + Math.random() * 3.5
      tracer.trailMaterial.uniforms.uOpacity.value = 0
      tracer.headMaterial.opacity = 0
    }

    const clock = new THREE.Clock()
    let isDragging = false
    let spreadProgress = 0
    let spreadTarget = 0
    let spreadScale = 1
    let hoveredPlaneIndex = -1
    const planeHoverProgress = new Float32Array(planeCount)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let lastPointerX = 0
    let lastPointerY = 0
    let isVisible = true
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const resize = () => {
      const size = heroRef.current?.clientHeight ?? container.clientHeight
      if (size === 0) return
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      renderer.setSize(size, size, false)
      camera.position.z =
        baseCameraDistance * (size / Math.max(container.clientWidth, 1))
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(heroRef.current ?? container)
    resize()

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true
    })
    intersectionObserver.observe(canvas)

    const updateHoveredPlane = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      planeStack.updateMatrixWorld(true)
      raycaster.setFromCamera(pointer, camera)
      const hoveredPlane = raycaster.intersectObjects(planeMeshes, false)[0]
        ?.object
      hoveredPlaneIndex = hoveredPlane
        ? planeMeshes.indexOf(hoveredPlane as THREE.Mesh)
        : -1
      spreadTarget = hoveredPlaneIndex >= 0 ? 1 : 0
      return hoveredPlaneIndex >= 0
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!updateHoveredPlane(event)) return
      isDragging = true
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      interactionTarget.setPointerCapture(event.pointerId)
    }

    const handlePointerLeave = () => {
      spreadTarget = 0
      hoveredPlaneIndex = -1
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateHoveredPlane(event)

      if (!isDragging) return
      planeStack.rotation.y += (event.clientX - lastPointerX) * 0.008
      planeStack.rotation.x += (event.clientY - lastPointerY) * 0.008
      lastPointerX = event.clientX
      lastPointerY = event.clientY
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging = false
      if (interactionTarget.hasPointerCapture(event.pointerId)) {
        interactionTarget.releasePointerCapture(event.pointerId)
      }
    }

    interactionTarget.addEventListener('pointerdown', handlePointerDown)
    interactionTarget.addEventListener('pointerleave', handlePointerLeave)
    interactionTarget.addEventListener('pointermove', handlePointerMove)
    interactionTarget.addEventListener('pointerup', handlePointerUp)
    interactionTarget.addEventListener('pointercancel', handlePointerUp)

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.05)
      if (!isVisible) return

      let updateGridGeometry = false
      if (Math.abs(spreadProgress - spreadTarget) > 0.001) {
        const spreadDamping = reduceMotion ? 1 : 1 - Math.exp(-4.5 * delta)
        spreadProgress = THREE.MathUtils.lerp(
          spreadProgress,
          spreadTarget,
          spreadDamping,
        )
        spreadScale = THREE.MathUtils.lerp(
          1,
          1.45,
          THREE.MathUtils.smoothstep(spreadProgress, 0, 1),
        )
        updateGridGeometry = true
      }

      planeMeshes.forEach((plane, index) => {
        const hoverTarget = index === hoveredPlaneIndex ? 1 : 0
        const hoverProgress = planeHoverProgress[index] ?? 0
        if (Math.abs(hoverProgress - hoverTarget) > 0.001) {
          const hoverDamping = reduceMotion ? 1 : 1 - Math.exp(-7 * delta)
          planeHoverProgress[index] = THREE.MathUtils.lerp(
            hoverProgress,
            hoverTarget,
            hoverDamping,
          )
          updateGridGeometry = true
        }

        const easedHover = THREE.MathUtils.smoothstep(
          planeHoverProgress[index] ?? 0,
          0,
          1,
        )
        const hoverScale = 1 + easedHover * 0.1
        plane.scale.set(hoverScale, hoverScale, 1)
        plane.position.y = (index * planeStep - cubeSize / 2) * spreadScale
        planeMaterials[index]!.opacity = THREE.MathUtils.lerp(
          0.05,
          0.16,
          easedHover,
        )
      })

      if (updateGridGeometry) {
        for (
          let vertex = 0;
          vertex < gridPositionAttribute.count;
          vertex += 1
        ) {
          const offset = vertex * 3
          const planeIndex = Math.floor(vertex / (gridSize * 4))
          const hoverScale =
            1 +
            THREE.MathUtils.smoothstep(
              planeHoverProgress[planeIndex] ?? 0,
              0,
              1,
            ) *
              0.1
          gridPositionAttribute.array[offset] =
            (baseGridPositions[offset] ?? 0) * hoverScale
          gridPositionAttribute.array[offset + 1] =
            (baseGridPositions[offset + 1] ?? 0) * spreadScale
          gridPositionAttribute.array[offset + 2] =
            (baseGridPositions[offset + 2] ?? 0) * hoverScale
        }
        gridPositionAttribute.needsUpdate = true
      }

      if (!reduceMotion) {
        tracers.forEach((tracer) => {
          if (tracer.delay > 0) {
            tracer.delay -= delta
            return
          }

          tracer.progress += tracer.speed * delta
          if (tracer.progress >= 1) {
            resetTracer(tracer)
            return
          }

          const fadeIn = THREE.MathUtils.smoothstep(tracer.progress, 0, 0.08)
          const fadeOut =
            1 - THREE.MathUtils.smoothstep(tracer.progress, 0.95, 1)
          const tracerOpacity = fadeIn * fadeOut
          const tracerPlaneScale =
            1 +
            THREE.MathUtils.smoothstep(
              planeHoverProgress[tracer.planeIndex] ?? 0,
              0,
              1,
            ) *
              0.1

          for (
            let pointIndex = 0;
            pointIndex < trailPointCount;
            pointIndex += 1
          ) {
            const tailProgress =
              tracer.progress - (1 - pointIndex / (trailPointCount - 1)) * 0.36
            const point = sampleTracerPath(
              tracer.path,
              tailProgress,
              tracer.samplePoint,
            )
            const offset = pointIndex * 3
            tracer.trailPositions[offset] = point.x * tracerPlaneScale
            tracer.trailPositions[offset + 1] = point.y * spreadScale
            tracer.trailPositions[offset + 2] = point.z * tracerPlaneScale
          }

          const head = sampleTracerPath(
            tracer.path,
            tracer.progress,
            tracer.samplePoint,
          )
          tracer.headPositions[0] = head.x * tracerPlaneScale
          tracer.headPositions[1] = head.y * spreadScale
          tracer.headPositions[2] = head.z * tracerPlaneScale
          tracer.trailAttribute.needsUpdate = true
          tracer.headAttribute.needsUpdate = true
          tracer.trailMaterial.uniforms.uOpacity.value = tracerOpacity * 0.9
          tracer.headMaterial.opacity = tracerOpacity
        })
      }

      if (!isDragging && !reduceMotion) {
        planeStack.rotation.y += 0.132 * delta
        planeStack.rotation.x += 0.036 * delta
      }
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      interactionTarget.removeEventListener('pointerdown', handlePointerDown)
      interactionTarget.removeEventListener('pointerleave', handlePointerLeave)
      interactionTarget.removeEventListener('pointermove', handlePointerMove)
      interactionTarget.removeEventListener('pointerup', handlePointerUp)
      interactionTarget.removeEventListener('pointercancel', handlePointerUp)
      geometry.dispose()
      material.dispose()
      planeGeometry.dispose()
      planeMaterials.forEach((planeMaterial) => planeMaterial.dispose())
      tracers.forEach((tracer) => {
        tracer.trailGeometry.dispose()
        tracer.trailMaterial.dispose()
        tracer.headGeometry.dispose()
        tracer.headMaterial.dispose()
      })
      renderer.dispose()
    }
  }, [heroRef])

  return (
    <div
      ref={containerRef}
      className="product-model mx-auto mt-4 max-w-[250px] sm:max-w-[300px] lg:mt-0 lg:max-w-none"
    >
      <canvas
        ref={canvasRef}
        className="product-model-canvas"
        aria-label="A rotating stack of grid planes with animated tracer paths. Drag to rotate it."
        role="img"
      />
    </div>
  )
}
