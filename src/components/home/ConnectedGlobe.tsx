import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GLOBE_RADIUS = 1.42
const ARC_POINT_COUNT = 288
const CONNECTION_COUNT = 10

type GlobeConnection = {
  geometry: THREE.BufferGeometry
  positionAttribute: THREE.BufferAttribute
  line: THREE.Line
  lineMaterial: THREE.LineBasicMaterial
  baseColor: THREE.Color
  endNode: THREE.Mesh
  endMaterial: THREE.MeshBasicMaterial
  impactRing: THREE.Mesh
  impactRingMaterial: THREE.MeshBasicMaterial
  startLabel: string
  endLabel: string
  progress: number
  delay: number
  speed: number
}

type GlobeLocation = {
  label: string
  latitude: number
  longitude: number
}

const LOCATIONS: GlobeLocation[] = [
  { label: 'San Francisco', latitude: 37.77, longitude: -122.42 },
  { label: 'Los Angeles', latitude: 34.05, longitude: -118.24 },
  { label: 'New York', latitude: 40.71, longitude: -74.01 },
  { label: 'Toronto', latitude: 43.65, longitude: -79.38 },
  { label: 'Mexico City', latitude: 19.43, longitude: -99.13 },
  { label: 'São Paulo', latitude: -23.55, longitude: -46.63 },
  { label: 'Buenos Aires', latitude: -34.6, longitude: -58.38 },
  { label: 'London', latitude: 51.51, longitude: -0.13 },
  { label: 'Paris', latitude: 48.86, longitude: 2.35 },
  { label: 'Madrid', latitude: 40.42, longitude: -3.7 },
  { label: 'Berlin', latitude: 52.52, longitude: 13.4 },
  { label: 'Lagos', latitude: 6.52, longitude: 3.38 },
  { label: 'Cairo', latitude: 30.04, longitude: 31.24 },
  { label: 'Nairobi', latitude: -1.29, longitude: 36.82 },
  { label: 'Cape Town', latitude: -33.92, longitude: 18.42 },
  { label: 'Dubai', latitude: 25.2, longitude: 55.27 },
  { label: 'Mumbai', latitude: 19.08, longitude: 72.88 },
  { label: 'Delhi', latitude: 28.61, longitude: 77.21 },
  { label: 'Bengaluru', latitude: 12.97, longitude: 77.59 },
  { label: 'Bangkok', latitude: 13.76, longitude: 100.5 },
  { label: 'Singapore', latitude: 1.35, longitude: 103.82 },
  { label: 'Hong Kong', latitude: 22.32, longitude: 114.17 },
  { label: 'Beijing', latitude: 39.9, longitude: 116.41 },
  { label: 'Jakarta', latitude: -6.21, longitude: 106.85 },
  { label: 'Tokyo', latitude: 35.68, longitude: 139.65 },
  { label: 'Seoul', latitude: 37.57, longitude: 126.98 },
  { label: 'Sydney', latitude: -33.87, longitude: 151.21 },
  { label: 'Auckland', latitude: -36.85, longitude: 174.76 },
]

function coordinateToPoint(latitude: number, longitude: number) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitude)
  const longitudeRadians = THREE.MathUtils.degToRad(longitude)
  const latitudeRadius = Math.cos(latitudeRadians)
  return new THREE.Vector3(
    latitudeRadius * Math.cos(longitudeRadians),
    Math.sin(latitudeRadians),
    -latitudeRadius * Math.sin(longitudeRadians),
  )
}

function randomConnectionPoints() {
  const startIndex = Math.floor(Math.random() * LOCATIONS.length)
  let endIndex = Math.floor(Math.random() * LOCATIONS.length)
  while (endIndex === startIndex) {
    endIndex = Math.floor(Math.random() * LOCATIONS.length)
  }
  const startLocation = LOCATIONS[startIndex]!
  const endLocation = LOCATIONS[endIndex]!
  return {
    start: coordinateToPoint(startLocation.latitude, startLocation.longitude),
    end: coordinateToPoint(endLocation.latitude, endLocation.longitude),
    startLabel: startLocation.label,
    endLabel: endLocation.label,
  }
}

function createArcPositions(
  start: THREE.Vector3,
  end: THREE.Vector3,
  height: number,
) {
  const positions = new Float32Array(ARC_POINT_COUNT * 3)
  const angle = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1))
  const angleSine = Math.sin(angle)

  for (let index = 0; index < ARC_POINT_COUNT; index += 1) {
    const progress = index / (ARC_POINT_COUNT - 1)
    const startWeight = Math.sin((1 - progress) * angle) / angleSine
    const endWeight = Math.sin(progress * angle) / angleSine
    const point = start
      .clone()
      .multiplyScalar(startWeight)
      .addScaledVector(end, endWeight)
      .normalize()
    const altitude = Math.sin(progress * Math.PI) * height
    point.multiplyScalar(GLOBE_RADIUS + altitude)
    point.toArray(positions, index * 3)
  }

  return positions
}

function createGridGeometry(radius: number) {
  const positions: number[] = []
  const addSegment = (start: THREE.Vector3, end: THREE.Vector3) => {
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z)
  }

  for (let latitude = -75; latitude <= 75; latitude += 15) {
    const latitudeRadians = THREE.MathUtils.degToRad(latitude)
    const ringRadius = Math.cos(latitudeRadians) * radius
    const y = Math.sin(latitudeRadians) * radius
    const segments = 96
    for (let index = 0; index < segments; index += 1) {
      const startAngle = (index / segments) * Math.PI * 2
      const endAngle = ((index + 1) / segments) * Math.PI * 2
      addSegment(
        new THREE.Vector3(
          Math.cos(startAngle) * ringRadius,
          y,
          Math.sin(startAngle) * ringRadius,
        ),
        new THREE.Vector3(
          Math.cos(endAngle) * ringRadius,
          y,
          Math.sin(endAngle) * ringRadius,
        ),
      )
    }
  }

  for (let longitude = 0; longitude < 360; longitude += 15) {
    const longitudeRadians = THREE.MathUtils.degToRad(longitude)
    const segments = 48
    for (let index = 0; index < segments; index += 1) {
      const startLatitude = -Math.PI / 2 + (index / segments) * Math.PI
      const endLatitude = -Math.PI / 2 + ((index + 1) / segments) * Math.PI
      addSegment(
        new THREE.Vector3(
          Math.cos(startLatitude) * Math.cos(longitudeRadians) * radius,
          Math.sin(startLatitude) * radius,
          Math.cos(startLatitude) * Math.sin(longitudeRadians) * radius,
        ),
        new THREE.Vector3(
          Math.cos(endLatitude) * Math.cos(longitudeRadians) * radius,
          Math.sin(endLatitude) * radius,
          Math.cos(endLatitude) * Math.sin(longitudeRadians) * radius,
        ),
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  return geometry
}

function createPointTexture() {
  const size = 32
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offsetX = (x + 0.5) / size - 0.5
      const offsetY = (y + 0.5) / size - 0.5
      const distance = Math.hypot(offsetX, offsetY) * 2
      const alpha = 1 - THREE.MathUtils.smoothstep(distance, 0.68, 1)
      const offset = (y * size + x) * 4
      data[offset] = 255
      data[offset + 1] = 255
      data[offset + 2] = 255
      data[offset + 3] = Math.round(alpha * 255)
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function createAtmosphereTexture() {
  const size = 256
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offsetX = (x + 0.5) / size - 0.5
      const offsetY = (y + 0.5) / size - 0.5
      const distance = Math.hypot(offsetX, offsetY) * 2
      const surfaceGlow = Math.exp(-Math.pow((distance - 0.735) / 0.032, 2))
      const atmosphere =
        THREE.MathUtils.smoothstep(distance, 0.68, 0.75) *
        (1 - THREE.MathUtils.smoothstep(distance, 0.74, 1))
      const alpha = THREE.MathUtils.clamp(
        surfaceGlow * 0.62 + atmosphere * 0.26,
        0,
        1,
      )
      const offset = (y * size + x) * 4
      data[offset] = Math.round(58 + surfaceGlow * 150)
      data[offset + 1] = Math.round(87 + surfaceGlow * 168)
      data[offset + 2] = 255
      data[offset + 3] = Math.round(alpha * 255)
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function createLandPointPositions(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const positions: number[] = []
  const rows = 94

  for (let row = 1; row < rows; row += 1) {
    const latitude = -90 + (row / rows) * 180
    const latitudeRadius = Math.cos(THREE.MathUtils.degToRad(latitude))
    const dotsForLatitude = Math.max(8, Math.round(latitudeRadius * 220))

    for (let index = 0; index < dotsForLatitude; index += 1) {
      const longitude = -180 + ((index + 0.5) / dotsForLatitude) * 360
      const pixelX = Math.min(
        width - 1,
        Math.max(0, Math.floor(((longitude + 180) / 360) * width)),
      )
      const pixelY = Math.min(
        height - 1,
        Math.max(0, Math.floor(((90 - latitude) / 180) * height)),
      )
      if ((pixels[(pixelY * width + pixelX) * 4] ?? 255) > 100) continue

      const point = coordinateToPoint(latitude, longitude).multiplyScalar(
        GLOBE_RADIUS * 1.008,
      )
      positions.push(point.x, point.y, point.z)
    }
  }

  return new Float32Array(positions)
}

export default function ConnectedGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x050607, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#050607')
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0.62, 0.45, 5.5)
    camera.lookAt(0, 0, 0)

    const globe = new THREE.Group()
    globe.rotation.x = -0.22
    globe.rotation.y =
      0.15 + Math.PI * ((new Date().getTimezoneOffset() || 0) / (60 * 12))
    globe.rotation.z = 0.08
    scene.add(globe)

    const shellGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 40)
    const shellMaterial = new THREE.MeshBasicMaterial({ color: '#07090d' })
    globe.add(new THREE.Mesh(shellGeometry, shellMaterial))

    const rimMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uInnerColor: { value: new THREE.Color('#6885ff') },
        uEdgeColor: { value: new THREE.Color('#e9ffff') },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -viewPosition.xyz;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uInnerColor;
        uniform vec3 uEdgeColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
          float brightEdge = pow(rim, 7.0);
          vec3 color = mix(uInnerColor, uEdgeColor, brightEdge);
          float alpha = pow(rim, 2.35) * 0.78;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const rim = new THREE.Mesh(shellGeometry, rimMaterial)
    rim.scale.setScalar(1.006)
    globe.add(rim)

    const atmosphereTexture = createAtmosphereTexture()
    const atmosphereMaterial = new THREE.SpriteMaterial({
      map: atmosphereTexture,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Sprite(atmosphereMaterial)
    atmosphere.scale.setScalar(GLOBE_RADIUS * 2 * 1.36)
    atmosphere.renderOrder = -1
    scene.add(atmosphere)

    const gridGeometry = createGridGeometry(GLOBE_RADIUS * 1.003)
    const gridMaterial = new THREE.LineBasicMaterial({
      color: '#91a8ee',
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    globe.add(new THREE.LineSegments(gridGeometry, gridMaterial))

    const pointTexture = createPointTexture()
    const pointGeometry = new THREE.BufferGeometry()
    pointGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(), 3),
    )
    const pointMaterial = new THREE.PointsMaterial({
      color: '#dce5ff',
      map: pointTexture,
      size: 0.021,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    globe.add(new THREE.Points(pointGeometry, pointMaterial))

    let isDisposed = false
    const landMask = new Image()
    landMask.src = '/earth-land-mask.png'
    landMask.addEventListener('load', () => {
      if (isDisposed) return
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = landMask.naturalWidth
      maskCanvas.height = landMask.naturalHeight
      const context = maskCanvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(landMask, 0, 0)
      const imageData = context.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height,
      )
      pointGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          createLandPointPositions(
            imageData.data,
            imageData.width,
            imageData.height,
          ),
          3,
        ),
      )
      pointGeometry.computeBoundingSphere()
    })

    const impactGeometry = new THREE.CircleGeometry(0.02, 24)
    const impactRingGeometry = new THREE.RingGeometry(0.044, 0.049, 28)
    const surfaceNormal = new THREE.Vector3(0, 0, 1)
    const connectionColors = [
      '#d9ff43',
      '#8da4ff',
      '#f1efe8',
      '#72f1b8',
    ] as const
    const hoverColor = new THREE.Color('#ffffff')
    let hoveredConnection: GlobeConnection | null = null

    const resetConnection = (
      connection: GlobeConnection,
      immediate = false,
    ) => {
      const { start, end, startLabel, endLabel } = randomConnectionPoints()
      const positions = createArcPositions(
        start,
        end,
        THREE.MathUtils.randFloat(0.34, 0.72),
      )
      connection.positionAttribute.copyArray(positions)
      connection.positionAttribute.needsUpdate = true
      connection.geometry.computeBoundingSphere()
      connection.geometry.setDrawRange(0, 0)
      connection.endNode.position.copy(end).multiplyScalar(GLOBE_RADIUS * 1.012)
      connection.endNode.quaternion.setFromUnitVectors(surfaceNormal, end)
      connection.impactRing.position
        .copy(end)
        .multiplyScalar(GLOBE_RADIUS * 1.014)
      connection.impactRing.quaternion.setFromUnitVectors(surfaceNormal, end)
      connection.startLabel = startLabel
      connection.endLabel = endLabel
      connection.progress = 0
      connection.delay = immediate
        ? THREE.MathUtils.randFloat(0, 2.5)
        : THREE.MathUtils.randFloat(0.4, 3.6)
      connection.speed = THREE.MathUtils.randFloat(0.22, 0.38)
      connection.lineMaterial.opacity = 0
      connection.endMaterial.opacity = 0
      connection.impactRingMaterial.opacity = 0
      connection.endNode.scale.setScalar(0.6)
      connection.impactRing.scale.setScalar(0.4)
      if (hoveredConnection === connection) {
        hoveredConnection = null
      }
    }

    const connections = Array.from(
      { length: CONNECTION_COUNT },
      (_, index): GlobeConnection => {
        const color = connectionColors[index % connectionColors.length]
        const baseColor = new THREE.Color(color)
        const positions = new Float32Array(ARC_POINT_COUNT * 3)
        const positionAttribute = new THREE.BufferAttribute(positions, 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', positionAttribute)
        const lineMaterial = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        const line = new THREE.Line(geometry, lineMaterial)
        globe.add(line)

        const endMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        const impactRingMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        const endNode = new THREE.Mesh(impactGeometry, endMaterial)
        const impactRing = new THREE.Mesh(
          impactRingGeometry,
          impactRingMaterial,
        )
        globe.add(endNode, impactRing)

        const connection = {
          geometry,
          positionAttribute,
          line,
          lineMaterial,
          baseColor,
          endNode,
          endMaterial,
          impactRing,
          impactRingMaterial,
          startLabel: '',
          endLabel: '',
          progress: 0,
          delay: 0,
          speed: 0.3,
        }
        resetConnection(connection, true)
        return connection
      },
    )

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()

      if (camera.aspect > 1.1) {
        globe.position.set(1.5, 0.02, 0)
        globe.scale.setScalar(1)
      } else {
        globe.position.set(0, 0.22, 0)
        globe.scale.setScalar(0.88)
      }
      atmosphere.position.copy(globe.position)
      atmosphere.scale.setScalar(GLOBE_RADIUS * 2 * 1.36 * globe.scale.x)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const raycaster = new THREE.Raycaster()
    raycaster.params.Line = { threshold: 0.075 }
    const pointer = new THREE.Vector2()
    let isDragging = false
    let pointerTravel = 0
    let lastPointerX = 0
    let lastPointerY = 0
    let rotationVelocityX = 0
    let rotationVelocityY = 0

    const updatePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      return bounds
    }

    const updateHoveredConnection = (event: PointerEvent) => {
      updatePointer(event)
      globe.updateMatrixWorld(true)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(
        connections.map((connection) => connection.line),
        false,
      )[0]
      const connection = hit
        ? (connections.find((item) => item.line === hit.object) ?? null)
        : null
      hoveredConnection = connection
      canvas.style.cursor = 'grab'
    }

    const handlePointerDown = (event: PointerEvent) => {
      isDragging = true
      pointerTravel = 0
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      rotationVelocityX = 0
      rotationVelocityY = 0
      canvas.style.cursor = 'grabbing'
      canvas.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) {
        updateHoveredConnection(event)
        return
      }

      const deltaX = event.clientX - lastPointerX
      const deltaY = event.clientY - lastPointerY
      pointerTravel += Math.hypot(deltaX, deltaY)
      globe.rotation.y += deltaX * 0.006
      globe.rotation.x = THREE.MathUtils.clamp(
        globe.rotation.x + deltaY * 0.0045,
        -1.05,
        0.8,
      )
      rotationVelocityY = deltaX * 0.3
      rotationVelocityX = deltaY * 0.22
      lastPointerX = event.clientX
      lastPointerY = event.clientY
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging = false
      canvas.style.cursor = 'grab'
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      if (pointerTravel < 5) updateHoveredConnection(event)
    }

    const handlePointerLeave = () => {
      if (isDragging) return
      hoveredConnection = null
      canvas.style.cursor = 'grab'
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const rotationStep = 0.12
      if (event.key === 'ArrowLeft') globe.rotation.y -= rotationStep
      else if (event.key === 'ArrowRight') globe.rotation.y += rotationStep
      else if (event.key === 'ArrowUp') {
        globe.rotation.x = Math.max(-1.05, globe.rotation.x - rotationStep)
      } else if (event.key === 'ArrowDown') {
        globe.rotation.x = Math.min(0.8, globe.rotation.x + rotationStep)
      } else return
      event.preventDefault()
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    canvas.addEventListener('keydown', handleKeyDown)

    let isVisible = true
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true
    })
    intersectionObserver.observe(canvas)

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion) {
      connections.forEach((connection, index) => {
        connection.delay = 0
        connection.progress = 0.38 + (index % 4) * 0.16
      })
    }

    let previousTime = performance.now()
    renderer.setAnimationLoop((time) => {
      const delta = Math.min((time - previousTime) / 1000, 0.05)
      previousTime = time
      if (!isVisible) return

      if (!reduceMotion && !isDragging) {
        globe.rotation.y += delta * (0.055 + rotationVelocityY)
        globe.rotation.x = THREE.MathUtils.clamp(
          globe.rotation.x + delta * rotationVelocityX,
          -1.05,
          0.8,
        )
        const inertiaDamping = Math.exp(-3.8 * delta)
        rotationVelocityX *= inertiaDamping
        rotationVelocityY *= inertiaDamping
      }

      connections.forEach((connection) => {
        if (!reduceMotion && connection.delay > 0) {
          connection.delay -= delta
          return
        }
        if (!reduceMotion) connection.progress += delta * connection.speed

        const travelProgress = THREE.MathUtils.clamp(connection.progress, 0, 1)
        const visiblePoints = Math.max(
          2,
          Math.ceil(travelProgress * ARC_POINT_COUNT),
        )
        connection.geometry.setDrawRange(0, visiblePoints)
        const hoverIntensity = connection === hoveredConnection ? 1.28 : 1
        connection.lineMaterial.opacity =
          THREE.MathUtils.smoothstep(travelProgress, 0, 0.08) *
          (1 - THREE.MathUtils.smoothstep(connection.progress, 1, 1.28)) *
          0.82 *
          hoverIntensity
        connection.lineMaterial.color.lerp(
          connection === hoveredConnection ? hoverColor : connection.baseColor,
          0.16,
        )
        const impact = THREE.MathUtils.smoothstep(travelProgress, 0.96, 1)
        const impactFade =
          1 - THREE.MathUtils.smoothstep(connection.progress, 1.12, 1.3)
        connection.endMaterial.opacity = impact * impactFade
        connection.endNode.scale.setScalar(0.6 + impact * 0.4)

        const ringProgress = THREE.MathUtils.smoothstep(
          connection.progress,
          0.97,
          1.22,
        )
        connection.impactRingMaterial.opacity =
          THREE.MathUtils.smoothstep(connection.progress, 0.96, 1) *
          (1 - ringProgress) *
          0.9
        connection.impactRing.scale.setScalar(0.4 + ringProgress * 2.2)

        if (!reduceMotion && connection.progress >= 1.3) {
          resetConnection(connection)
        }
      })

      renderer.render(scene, camera)
    })

    return () => {
      isDisposed = true
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('keydown', handleKeyDown)
      connections.forEach((connection) => {
        connection.geometry.dispose()
        connection.lineMaterial.dispose()
        connection.endMaterial.dispose()
        connection.impactRingMaterial.dispose()
      })
      shellGeometry.dispose()
      shellMaterial.dispose()
      rimMaterial.dispose()
      atmosphereMaterial.dispose()
      atmosphereTexture.dispose()
      gridGeometry.dispose()
      gridMaterial.dispose()
      pointGeometry.dispose()
      pointMaterial.dispose()
      pointTexture.dispose()
      impactGeometry.dispose()
      impactRingGeometry.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-x-0 top-[72px] bottom-0">
      <canvas
        ref={canvasRef}
        className="block size-full cursor-grab touch-pan-y outline-none"
        aria-label="Interactive globe with animated connections. Drag or use arrow keys to rotate."
        role="img"
        tabIndex={0}
      />
    </div>
  )
}
