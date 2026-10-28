import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const GLOBE_RADIUS = 1.42
const ARC_POINT_COUNT = 96
const ARC_RIBBON_SEGMENTS = 64
const CONNECTION_COUNT = 10
const CAMERA_FOV = 38
const NAVIGATION_HEIGHT = 72

const globePalettes = {
  light: {
    atmosphere: '#d8d5cd',
    background: '#f1efe8',
    connections: ['#335cff', '#5271d9', '#335cff', '#7187d8'],
    dots: '#303033',
    grid: '#335cff',
    hover: '#000000',
    rimEdge: '#d8d5cd',
    rimInner: '#f4f2ed',
    shell: '#ffffff',
    shellEmissive: '#f8f7f3',
    sunlight: '#ffffff',
  },
  dark: {
    atmosphere: '#aea8ff',
    background: '#050607',
    connections: ['#d9ff43', '#8da4ff', '#f1efe8', '#72f1b8'],
    dots: '#dce5ff',
    grid: '#91a8ee',
    hover: '#ffffff',
    rimEdge: '#e9ffff',
    rimInner: '#6885ff',
    shell: '#111842',
    shellEmissive: '#010208',
    sunlight: '#ffffff',
  },
} as const

function getPrefersDarkMode() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

type GlobeConnection = {
  index: number
  hitGeometry: THREE.BufferGeometry
  hitLine: THREE.Line
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
  hoverAmount: number
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
    const point =
      Math.abs(angleSine) > 0.0001
        ? start
            .clone()
            .multiplyScalar(Math.sin((1 - progress) * angle) / angleSine)
            .addScaledVector(end, Math.sin(progress * angle) / angleSine)
            .normalize()
        : start.clone().lerp(end, progress).normalize()
    point.multiplyScalar(
      GLOBE_RADIUS * 1.008 + Math.sin(progress * Math.PI) * height,
    )
    point.toArray(positions, index * 3)
  }

  return positions
}

function createArcRibbonGeometry() {
  const positions = new Float32Array((ARC_RIBBON_SEGMENTS + 1) * 2 * 3)
  const indices: number[] = []

  for (let index = 0; index <= ARC_RIBBON_SEGMENTS; index += 1) {
    const progress = index / ARC_RIBBON_SEGMENTS
    positions.set([progress, -1, 0, progress, 1, 0], index * 6)

    if (index === ARC_RIBBON_SEGMENTS) continue
    const vertex = index * 2
    indices.push(
      vertex,
      vertex + 1,
      vertex + 2,
      vertex + 1,
      vertex + 3,
      vertex + 2,
    )
  }

  const geometry = new THREE.InstancedBufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.instanceCount = CONNECTION_COUNT
  return geometry
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

function createAtmosphereTexture(prefersDarkMode: boolean) {
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
      data[offset] = prefersDarkMode ? Math.round(58 + surfaceGlow * 150) : 255
      data[offset + 1] = prefersDarkMode
        ? Math.round(87 + surfaceGlow * 168)
        : 255
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
        GLOBE_RADIUS * 1.003,
      )
      positions.push(point.x, point.y, point.z)
    }
  }

  return new Float32Array(positions)
}

export default function ConnectedGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [prefersDarkMode, setPrefersDarkMode] = useState(getPrefersDarkMode)

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    const updateColorScheme = () => setPrefersDarkMode(colorScheme.matches)

    colorScheme.addEventListener('change', updateColorScheme)
    return () => colorScheme.removeEventListener('change', updateColorScheme)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const palette = prefersDarkMode ? globePalettes.dark : globePalettes.light
    const surfaceBlending = prefersDarkMode
      ? THREE.AdditiveBlending
      : THREE.NormalBlending

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(palette.background, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(palette.background)
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)
    camera.position.set(0.62, 0.45, 5.5)
    camera.lookAt(0, 0, 0)

    const globeRig = new THREE.Group()
    scene.add(globeRig)

    const globe = new THREE.Group()
    globe.rotation.y =
      0.15 + Math.PI * ((new Date().getTimezoneOffset() || 0) / (60 * 12))
    globeRig.add(globe)

    const sunDirection = new THREE.Vector3()
    const sunSettings = {
      azimuth: 3,
      atmosphereIntensity: 0.74,
      elevation: 1,
      terminatorSoftness: 0.2,
    }
    const updateSunDirection = () => {
      const azimuth = THREE.MathUtils.degToRad(sunSettings.azimuth)
      const elevation = THREE.MathUtils.degToRad(sunSettings.elevation)
      const elevationRadius = Math.cos(elevation)
      sunDirection
        .set(
          elevationRadius * Math.sin(azimuth),
          Math.sin(elevation),
          elevationRadius * Math.cos(azimuth),
        )
        .normalize()
    }
    updateSunDirection()

    const shellGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 40)
    const shellMaterial = prefersDarkMode
      ? new THREE.MeshStandardMaterial({
          color: palette.shell,
          emissive: palette.shellEmissive,
          emissiveIntensity: 0.12,
          metalness: 0,
          roughness: 0.82,
        })
      : new THREE.MeshBasicMaterial({
          color: palette.shell,
          toneMapped: false,
        })
    globe.add(new THREE.Mesh(shellGeometry, shellMaterial))

    const sunLight = new THREE.DirectionalLight(palette.sunlight, 0.65)
    sunLight.target = globeRig
    sunLight.position.copy(globeRig.position).addScaledVector(sunDirection, 8)
    scene.add(sunLight)

    const rimMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uInnerColor: { value: new THREE.Color(palette.rimInner) },
        uEdgeColor: { value: new THREE.Color(palette.rimEdge) },
        uSunDirection: { value: sunDirection },
        uTerminatorSoftness: { value: sunSettings.terminatorSoftness },
        uThickness: { value: 0.45 },
        uWhiteLineThickness: { value: 0.22 },
      },
      vertexShader: `
        varying vec3 vViewNormal;
        varying vec3 vWorldNormal;
        varying vec3 vViewPosition;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vViewNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vViewPosition = -viewPosition.xyz;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uInnerColor;
        uniform vec3 uEdgeColor;
        uniform vec3 uSunDirection;
        uniform float uTerminatorSoftness;
        uniform float uThickness;
        uniform float uWhiteLineThickness;
        varying vec3 vViewNormal;
        varying vec3 vWorldNormal;
        varying vec3 vViewPosition;

        void main() {
          float rim = 1.0 - abs(dot(normalize(vViewNormal), normalize(vViewPosition)));
          float sunAngle = dot(normalize(vWorldNormal), normalize(uSunDirection));
          float sunlight = smoothstep(-uTerminatorSoftness, uTerminatorSoftness, sunAngle);
          float brightEdge = pow(rim, 1.0 / max(uWhiteLineThickness, 0.001));
          vec3 color = mix(uInnerColor, uEdgeColor, brightEdge);
          float alpha = pow(rim, 1.0 / max(uThickness, 0.001)) * mix(0.04, 1.0, sunlight) * 0.72;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: surfaceBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const rim = new THREE.Mesh(shellGeometry, rimMaterial)
    rim.scale.setScalar(1.006)
    globe.add(rim)

    const atmosphereTexture = createAtmosphereTexture(prefersDarkMode)
    const atmosphereMaterial = new THREE.SpriteMaterial({
      color: palette.atmosphere,
      map: atmosphereTexture,
      transparent: true,
      opacity: sunSettings.atmosphereIntensity,
      blending: surfaceBlending,
      depthTest: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Sprite(atmosphereMaterial)
    atmosphere.renderOrder = -1
    scene.add(atmosphere)

    const gridGeometry = createGridGeometry(GLOBE_RADIUS * 1.003)
    const gridMaterial = new THREE.LineBasicMaterial({
      color: palette.grid,
      transparent: true,
      opacity: 0.14,
      blending: surfaceBlending,
      depthWrite: false,
    })
    globe.add(new THREE.LineSegments(gridGeometry, gridMaterial))

    const dotGeometry = new THREE.PlaneGeometry(1, 1)
    const dotMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(palette.dots) },
        uDiscSize: { value: 0.0075 },
        uOpacity: { value: 0.72 },
      },
      vertexShader: `
        uniform float uDiscSize;
        varying float vFacing;
        varying vec2 vUv;

        void main() {
          vec3 instanceNormal = normalize(mat3(instanceMatrix) * normal);
          vec3 viewNormal = normalize(normalMatrix * instanceNormal);
          vFacing = smoothstep(0.0, 0.35, viewNormal.z);
          vUv = uv;
          vec4 viewPosition = modelViewMatrix * instanceMatrix * vec4(position * uDiscSize, 1.0);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vFacing;
        varying vec2 vUv;

        void main() {
          float distanceFromCenter = length(vUv - vec2(0.5));
          float circle = 1.0 - smoothstep(0.46, 0.5, distanceFromCenter);
          float alpha = uOpacity * vFacing * circle;
          if (alpha < 0.005) discard;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      blending: surfaceBlending,
      depthWrite: false,
    })
    let landDots: THREE.InstancedMesh | undefined

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
      const positions = createLandPointPositions(
        imageData.data,
        imageData.width,
        imageData.height,
      )
      const dots = new THREE.InstancedMesh(
        dotGeometry,
        dotMaterial,
        positions.length / 3,
      )
      const position = new THREE.Vector3()
      const normal = new THREE.Vector3()
      const quaternion = new THREE.Quaternion()
      const matrix = new THREE.Matrix4()
      const scale = new THREE.Vector3(1, 1, 1)
      const forward = new THREE.Vector3(0, 0, 1)

      for (let index = 0; index < positions.length; index += 3) {
        position.fromArray(positions, index)
        normal.copy(position).normalize()
        quaternion.setFromUnitVectors(forward, normal)
        matrix.compose(position, quaternion, scale)
        dots.setMatrixAt(index / 3, matrix)
      }

      dots.instanceMatrix.needsUpdate = true
      dots.frustumCulled = false
      globe.add(dots)
      landDots = dots
    })

    const impactGeometry = new THREE.CircleGeometry(0.02, 24)
    const impactRingGeometry = new THREE.RingGeometry(0.044, 0.049, 28)
    const surfaceNormal = new THREE.Vector3(0, 0, 1)
    const connectionColors = palette.connections
    const hoverColor = new THREE.Color(palette.hover)
    const arcGeometry = createArcRibbonGeometry()
    const arcStartAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT * 3),
      3,
    )
    const arcEndAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT * 3),
      3,
    )
    const arcHeightAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT),
      1,
    )
    const arcColorAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT * 3),
      3,
    )
    const arcProgressAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT),
      1,
    )
    const arcTailAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT),
      1,
    )
    const arcOpacityAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT),
      1,
    )
    const arcHoverAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(CONNECTION_COUNT),
      1,
    )
    arcGeometry.setAttribute('aStart', arcStartAttribute)
    arcGeometry.setAttribute('aEnd', arcEndAttribute)
    arcGeometry.setAttribute('aHeight', arcHeightAttribute)
    arcGeometry.setAttribute('aColor', arcColorAttribute)
    arcGeometry.setAttribute('aProgress', arcProgressAttribute)
    arcGeometry.setAttribute('aTailProgress', arcTailAttribute)
    arcGeometry.setAttribute('aOpacity', arcOpacityAttribute)
    arcGeometry.setAttribute('aHover', arcHoverAttribute)

    const arcMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uLineWidth: { value: 2 },
        uGlobeRadius: { value: GLOBE_RADIUS },
        uHoverColor: { value: hoverColor },
      },
      vertexShader: `
        uniform vec2 uResolution;
        uniform float uLineWidth;
        uniform float uGlobeRadius;
        attribute vec3 aStart;
        attribute vec3 aEnd;
        attribute float aHeight;
        attribute vec3 aColor;
        attribute float aProgress;
        attribute float aTailProgress;
        attribute float aOpacity;
        attribute float aHover;
        varying float vSide;
        varying float vProgress;
        varying float vArcProgress;
        varying float vTailProgress;
        varying float vOpacity;
        varying float vHover;
        varying vec3 vColor;

        vec3 arcPoint(vec3 start, vec3 end, float height, float progress) {
          float angle = acos(clamp(dot(start, end), -1.0, 1.0));
          float angleSine = sin(angle);
          vec3 direction = abs(angleSine) > 0.0001
            ? normalize(
                start * (sin((1.0 - progress) * angle) / angleSine)
                + end * (sin(progress * angle) / angleSine)
              )
            : normalize(mix(start, end, progress));
          float radius = uGlobeRadius * 1.008 + sin(progress * 3.14159265) * height;
          return direction * radius;
        }

        void main() {
          float progress = position.x;
          float side = position.y;
          vec3 point = arcPoint(aStart, aEnd, aHeight, progress);
          float previousProgress = max(0.0, progress - 0.002);
          float nextProgress = min(1.0, progress + 0.002);
          vec3 tangent = normalize(
            arcPoint(aStart, aEnd, aHeight, nextProgress)
              - arcPoint(aStart, aEnd, aHeight, previousProgress)
          );

          vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(point, 1.0);
          vec4 clipTangent = projectionMatrix * modelViewMatrix * vec4(point + tangent * 0.01, 1.0);
          vec2 screenPosition = clipPosition.xy / clipPosition.w;
          vec2 screenTangent = clipTangent.xy / clipTangent.w - screenPosition;
          screenTangent *= uResolution;
          float tangentLength = length(screenTangent);
          vec2 screenPerpendicular = tangentLength > 0.0001
            ? vec2(-screenTangent.y, screenTangent.x) / tangentLength
            : vec2(1.0, 0.0);
          vec2 ndcOffset = screenPerpendicular * side * uLineWidth / uResolution;
          clipPosition.xy += ndcOffset * clipPosition.w;

          gl_Position = clipPosition;
          vSide = side;
          vProgress = progress;
          vArcProgress = aProgress;
          vTailProgress = aTailProgress;
          vOpacity = aOpacity;
          vHover = aHover;
          vColor = aColor;
        }
      `,
      fragmentShader: `
        uniform vec3 uHoverColor;
        varying float vSide;
        varying float vProgress;
        varying float vArcProgress;
        varying float vTailProgress;
        varying float vOpacity;
        varying float vHover;
        varying vec3 vColor;

        void main() {
          if (vProgress < vTailProgress || vProgress > vArcProgress) discard;
          float edge = 1.0 - smoothstep(0.78, 1.0, abs(vSide));
          float alpha = edge * vOpacity * mix(1.0, 1.28, vHover);
          if (alpha < 0.005) discard;
          vec3 color = mix(vColor, uHoverColor, vHover * 0.78);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial)
    arcMesh.frustumCulled = false
    globe.add(arcMesh)

    const hitMaterial = new THREE.LineBasicMaterial()
    let hoveredConnection: GlobeConnection | null = null

    const resetConnection = (
      connection: GlobeConnection,
      immediate = false,
    ) => {
      const { start, end, startLabel, endLabel } = randomConnectionPoints()
      const height = THREE.MathUtils.randFloat(0.34, 0.72)
      const positions = createArcPositions(start, end, height)
      connection.hitGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      )
      connection.hitGeometry.computeBoundingSphere()
      connection.hitGeometry.setDrawRange(0, 0)
      arcStartAttribute.setXYZ(connection.index, start.x, start.y, start.z)
      arcEndAttribute.setXYZ(connection.index, end.x, end.y, end.z)
      arcHeightAttribute.setX(connection.index, height)
      arcProgressAttribute.setX(connection.index, 0)
      arcTailAttribute.setX(connection.index, 0)
      arcOpacityAttribute.setX(connection.index, 0)
      arcHoverAttribute.setX(connection.index, 0)
      arcStartAttribute.needsUpdate = true
      arcEndAttribute.needsUpdate = true
      arcHeightAttribute.needsUpdate = true
      arcProgressAttribute.needsUpdate = true
      arcTailAttribute.needsUpdate = true
      arcOpacityAttribute.needsUpdate = true
      arcHoverAttribute.needsUpdate = true
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
      connection.endMaterial.opacity = 0
      connection.impactRingMaterial.opacity = 0
      connection.hoverAmount = 0
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
        const hitGeometry = new THREE.BufferGeometry()
        hitGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3),
        )
        const hitLine = new THREE.Line(hitGeometry, hitMaterial)
        hitLine.layers.set(1)
        globe.add(hitLine)
        arcColorAttribute.setXYZ(index, baseColor.r, baseColor.g, baseColor.b)

        const endMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: surfaceBlending,
          depthWrite: false,
        })
        const impactRingMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: surfaceBlending,
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
          index,
          hitGeometry,
          hitLine,
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
          hoverAmount: 0,
        }
        resetConnection(connection, true)
        return connection
      },
    )
    arcColorAttribute.needsUpdate = true

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return
      const contentHeight = Math.max(1, height - NAVIGATION_HEIGHT)
      const contentAspect = width / contentHeight
      const baseHalfFov = THREE.MathUtils.degToRad(CAMERA_FOV) / 2
      const adjustedFov =
        2 * Math.atan(Math.tan(baseHalfFov) * (height / contentHeight))

      renderer.setSize(width, height, false)
      arcMaterial.uniforms.uResolution!.value.set(width, height)
      camera.aspect = width / height
      camera.fov = THREE.MathUtils.radToDeg(adjustedFov)
      camera.setViewOffset(
        width,
        height,
        0,
        -NAVIGATION_HEIGHT / 2,
        width,
        height,
      )
      camera.updateProjectionMatrix()

      if (contentAspect > 1.1) {
        globeRig.position.set(1.5, 0.02, 0)
        globeRig.scale.setScalar(1)
      } else {
        globeRig.position.set(0, 0.22, 0)
        globeRig.scale.setScalar(0.88)
      }
      sunLight.position.copy(globeRig.position).addScaledVector(sunDirection, 8)
      atmosphere.position.copy(globeRig.position)
      atmosphere.scale.setScalar(GLOBE_RADIUS * 2 * 1.36 * globeRig.scale.x)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const raycaster = new THREE.Raycaster()
    raycaster.params.Line = { threshold: 0.075 }
    raycaster.layers.set(1)
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
      globeRig.updateMatrixWorld(true)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(
        connections.map((connection) => connection.hitLine),
        false,
      )[0]
      const connection = hit
        ? (connections.find((item) => item.hitLine === hit.object) ?? null)
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
      globeRig.rotation.x = THREE.MathUtils.clamp(
        globeRig.rotation.x + deltaY * 0.0045,
        -0.7,
        0.7,
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
        globeRig.rotation.x = Math.max(-0.7, globeRig.rotation.x - rotationStep)
      } else if (event.key === 'ArrowDown') {
        globeRig.rotation.x = Math.min(0.7, globeRig.rotation.x + rotationStep)
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
        globeRig.rotation.x = THREE.MathUtils.clamp(
          globeRig.rotation.x + delta * rotationVelocityX,
          -0.7,
          0.7,
        )
        const inertiaDamping = Math.exp(-3.8 * delta)
        const tiltReturn = 1 - Math.exp(-2.6 * delta)
        globeRig.rotation.x += (0 - globeRig.rotation.x) * tiltReturn
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
        connection.hitGeometry.setDrawRange(0, visiblePoints)
        const opacity =
          THREE.MathUtils.smoothstep(travelProgress, 0, 0.08) * 0.82
        const tailProgress = THREE.MathUtils.smoothstep(
          connection.progress,
          1,
          1.3,
        )
        connection.hoverAmount +=
          ((connection === hoveredConnection ? 1 : 0) -
            connection.hoverAmount) *
          0.16
        arcProgressAttribute.setX(connection.index, travelProgress)
        arcTailAttribute.setX(connection.index, tailProgress)
        arcOpacityAttribute.setX(connection.index, opacity)
        arcHoverAttribute.setX(connection.index, connection.hoverAmount)
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

      arcProgressAttribute.needsUpdate = true
      arcTailAttribute.needsUpdate = true
      arcOpacityAttribute.needsUpdate = true
      arcHoverAttribute.needsUpdate = true

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
        connection.hitGeometry.dispose()
        connection.endMaterial.dispose()
        connection.impactRingMaterial.dispose()
      })
      arcGeometry.dispose()
      arcMaterial.dispose()
      hitMaterial.dispose()
      shellGeometry.dispose()
      shellMaterial.dispose()
      rimMaterial.dispose()
      atmosphereMaterial.dispose()
      atmosphereTexture.dispose()
      gridGeometry.dispose()
      gridMaterial.dispose()
      dotGeometry.dispose()
      dotMaterial.dispose()
      landDots?.dispose()
      impactGeometry.dispose()
      impactRingGeometry.dispose()
      renderer.dispose()
    }
  }, [prefersDarkMode])

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* The entrance is CSS (.enter-soft), so server and client render the same. */}
      <canvas
        ref={canvasRef}
        className="enter-soft block size-full cursor-grab touch-pan-y outline-none"
        aria-label="Interactive globe with animated connections. Drag or use arrow keys to rotate."
        role="img"
        tabIndex={0}
      />
    </div>
  )
}
