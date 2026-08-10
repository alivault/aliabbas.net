import * as THREE from 'three'
import StackTraceAudio from './stack-trace-audio'
import type {
  GameInputMode,
  GameHudState,
  GameResult,
  MissionPhase,
  StackFrame,
  TouchFlightInput,
  TouchGameSettings,
} from './stack-trace-types'
import {
  createStackTraceAutomap,
  disposeStackTraceAutomap,
  updateStackTraceAutomap,
} from './stack-trace-map'
import type { StackTraceAutomap } from './stack-trace-map'
import {
  createBugVisual,
  createExitVisual,
  createFaultVisual,
  createLevelWorld,
  createRootVisual,
  connections,
  enemySpecs,
  exitPosition,
  faultSpecs,
  rootPosition,
  startPosition,
} from './stack-trace-world'
import type {
  EnemySpec,
  ExitVisual,
  FaultSpec,
  LevelWorld,
  RoomId,
} from './stack-trace-world'

type EngineCallbacks = {
  onHudChange: (hud: GameHudState) => void
  onPauseChange: (paused: boolean) => void
  onMapChange: (open: boolean) => void
  onEnd: (result: GameResult) => void
}

type BugVisual = ReturnType<typeof createBugVisual>
type FaultVisual = ReturnType<typeof createFaultVisual>
type RootVisual = ReturnType<typeof createRootVisual>

type Enemy = {
  spec: EnemySpec
  visual: BugVisual
  home: THREE.Vector3
  health: number
  maxHealth: number
  alive: boolean
  lastShot: number
  collisionCooldown: number
}

type Fault = {
  spec: FaultSpec
  visual: FaultVisual
  health: number
  maxHealth: number
  alive: boolean
}

type RootBug = {
  visual: RootVisual
  health: number
  maxHealth: number
  alive: boolean
  lastShot: number
}

type Projectile = {
  mesh: THREE.Mesh
  owner: 'player' | 'enemy'
  position: THREE.Vector3
  visualOffset: THREE.Vector3
  velocity: THREE.Vector3
  active: boolean
  life: number
}

type Burst = {
  points: THREE.Points
  positions: Float32Array
  velocities: Array<THREE.Vector3>
  material: THREE.PointsMaterial
  active: boolean
  life: number
}

const PLAYER_RADIUS = 0.58
const PLAYER_SPEED = 12
const PLAYER_ACCELERATION = 30
const SHOT_COOLDOWN = 0.16
const DESKTOP_ESCAPE_DURATION = 45
const TOUCH_ESCAPE_DURATION = 60
const MAP_CHAMBER_HALF = 5.25
const MAP_TUNNEL_RADIUS = 3.4
const PROJECTILE_AXIS = new THREE.Vector3(0, 1, 0)

const faultColors = ['#335cff', '#d9ff43', '#ff694a'] as const

function setObjectOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Sprite)) return
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material]
    materials.forEach((material) => {
      material.transparent = true
      material.opacity = opacity
    })
  })
}

export default class StackTraceEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly callbacks: EngineCallbacks
  private readonly likelyTouchDevice: boolean
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(72, 1, 0.06, 140)
  private readonly renderer: THREE.WebGLRenderer
  private readonly clock = new THREE.Clock()
  private readonly audio = new StackTraceAudio()
  private readonly world: LevelWorld
  private readonly exit: ExitVisual
  private readonly automap: StackTraceAutomap
  private readonly keys = new Set<string>()
  private readonly discoveredRooms = new Set<RoomId>()
  private readonly discoveredTunnels = new Set<number>()
  private readonly velocity = new THREE.Vector3()
  private readonly moveVector = new THREE.Vector3()
  private readonly forward = new THREE.Vector3()
  private readonly right = new THREE.Vector3()
  private readonly up = new THREE.Vector3()
  private readonly candidate = new THREE.Vector3()
  private readonly previousProjectilePosition = new THREE.Vector3()
  private readonly segment = new THREE.Line3()
  private readonly closestPoint = new THREE.Vector3()
  private readonly aimDirection = new THREE.Vector3()
  private readonly mapCenter = new THREE.Vector3()
  private readonly mapBounds = new THREE.Box3()
  private readonly mapBoundsSize = new THREE.Vector3()
  private readonly mapCameraOffset = new THREE.Vector3()
  private readonly enemies: Array<Enemy>
  private readonly faults: Array<Fault>
  private readonly root: RootBug
  private readonly projectiles: Array<Projectile> = []
  private readonly bursts: Array<Burst> = []
  private readonly resizeObserver: ResizeObserver

  private mode: MissionPhase = 'idle'
  private inputMode: GameInputMode = 'pointer'
  private touchInput: TouchFlightInput = {
    forward: 0,
    strafe: 0,
    vertical: 0,
  }
  private touchSensitivity = 1
  private paused = true
  private mapOpen = false
  private mapPointerId: number | null = null
  private mapPointerX = 0
  private mapPointerY = 0
  private mapOrbitYaw = 0.72
  private mapOrbitPitch = 0.62
  private mapDistance = 48
  private doorLocked = true
  private firing = false
  private yaw = 0
  private pitch = 0
  private roll = 0
  private elapsed = 0
  private escapeTime = DESKTOP_ESCAPE_DURATION
  private fireCooldown = 0
  private objectiveRefreshCooldown = 0
  private hudRefreshCooldown = 0
  private playerDamageCooldown = 0
  private shotsFired = 0
  private shotsHit = 0
  private bugsPurged = 0
  private hitPulse = 0
  private damagePulse = 0
  private objectiveFromRoom: RoomId | null = null
  private currentTargetFaultId: string | null = null
  private currentTargetPosition = new THREE.Vector3()
  private currentTargetLabel = 'Follow the failure to its source'
  private disposed = false
  private lockRequestTimer: number | undefined
  private renderScale = 1
  private performanceElapsed = 0
  private performanceFrames = 0

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas
    this.callbacks = callbacks
    this.likelyTouchDevice = window.matchMedia(
      '(hover: none), (pointer: coarse)',
    ).matches
    this.scene.background = new THREE.Color('#050608')
    this.scene.fog = new THREE.Fog('#050608', 12, 72)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.likelyTouchDevice,
      powerPreference: 'high-performance',
    })
    this.applyRendererPixelRatio()
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15

    this.scene.add(new THREE.HemisphereLight('#8da4ff', '#10100f', 1.15))
    this.scene.add(new THREE.AmbientLight('#cbd3ff', 0.55))
    this.addZoneLight('#335cff', new THREE.Vector3(0, 0, -28))
    this.addZoneLight('#ff694a', new THREE.Vector3(0, -24, -56))
    if (!this.likelyTouchDevice) {
      this.addZoneLight('#d9ff43', new THREE.Vector3(0, -24, -28))
      this.addZoneLight('#8da4ff', new THREE.Vector3(0, -48, -56))
    }

    this.world = createLevelWorld(this.scene)
    this.exit = createExitVisual()
    this.exit.group.position.copy(exitPosition)
    this.exit.group.visible = false
    this.scene.add(this.exit.group)
    this.automap = createStackTraceAutomap()
    this.faults = faultSpecs.map((spec, index) => {
      const visual = createFaultVisual(faultColors[index] ?? '#ff694a')
      visual.group.position.set(
        spec.position[0],
        spec.position[1],
        spec.position[2],
      )
      this.scene.add(visual.group)
      return {
        spec,
        visual,
        health: 5,
        maxHealth: 5,
        alive: true,
      }
    })
    this.enemies = enemySpecs.map((spec) => {
      const visual = createBugVisual(
        spec.kind === 'crawler' ? '#ff694a' : '#d9ff43',
      )
      const home = new THREE.Vector3(...spec.position)
      visual.group.position.copy(home)
      visual.group.scale.setScalar(spec.kind === 'crawler' ? 0.9 : 0.78)
      this.scene.add(visual.group)
      return {
        spec,
        visual,
        home,
        health: spec.kind === 'crawler' ? 3 : 2,
        maxHealth: spec.kind === 'crawler' ? 3 : 2,
        alive: true,
        lastShot: -10,
        collisionCooldown: 0,
      }
    })

    const rootVisual = createRootVisual()
    rootVisual.group.position.copy(rootPosition)
    this.scene.add(rootVisual.group)
    this.root = {
      visual: rootVisual,
      health: 18,
      maxHealth: 18,
      alive: true,
      lastShot: -10,
    }

    this.createProjectilePool()
    this.createBurstPool()
    this.camera.position.copy(startPosition)
    this.camera.rotation.set(0, 0, 0, 'YXZ')
    this.refreshObjective(true)
    this.emitHud()

    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
    this.resize()

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('blur', this.handleBlur)
    canvas.addEventListener('contextmenu', this.handleContextMenu)
    canvas.addEventListener('pointerdown', this.handleMapPointerDown)
    canvas.addEventListener('pointermove', this.handleMapPointerMove)
    canvas.addEventListener('pointerup', this.handleMapPointerUp)
    canvas.addEventListener('pointercancel', this.handleMapPointerUp)
    canvas.addEventListener('wheel', this.handleMapWheel, { passive: false })
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.renderer.setAnimationLoop(this.animate)
  }

  start = (mode: GameInputMode, settings?: TouchGameSettings) => {
    this.inputMode = mode
    this.touchSensitivity = THREE.MathUtils.clamp(
      settings?.sensitivity ?? 1,
      0.65,
      1.5,
    )
    this.renderScale = 1
    this.applyRendererPixelRatio()
    this.resize()
    this.resetMission()
    this.mode = 'hunt'
    this.audio.playMissionStart()
    this.callbacks.onMapChange(false)
    this.emitHud()
    if (this.inputMode === 'touch') {
      this.paused = false
      this.callbacks.onPauseChange(false)
    } else {
      this.requestPointerLock()
    }
  }

  resume = () => {
    if (this.mode !== 'hunt' && this.mode !== 'escape') return
    if (this.paused) this.audio.playResume()
    if (this.inputMode === 'touch') {
      this.paused = false
      this.callbacks.onPauseChange(false)
    } else {
      this.requestPointerLock()
    }
  }

  pause = () => {
    if (this.mode !== 'hunt' && this.mode !== 'escape') return
    if (!this.paused) this.audio.playPause()
    if (this.mapOpen) {
      this.mapOpen = false
      this.mapPointerId = null
      this.callbacks.onMapChange(false)
    }
    this.paused = true
    this.firing = false
    this.keys.clear()
    this.resetTouchInput()
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }
    this.callbacks.onPauseChange(true)
  }

  toggleMap = () => {
    if (this.mode !== 'hunt' && this.mode !== 'escape') return
    if (this.mapOpen) {
      this.mapOpen = false
      this.mapPointerId = null
      this.audio.playMap(false)
      this.callbacks.onMapChange(false)
      if (this.inputMode === 'touch') {
        this.paused = false
        this.callbacks.onPauseChange(false)
      } else {
        this.requestPointerLock()
      }
      return
    }
    if (this.paused) return

    this.mapOpen = true
    this.paused = true
    this.audio.playMap(true)
    this.firing = false
    this.keys.clear()
    this.resetTouchInput()
    this.updateMapDiscovery()
    this.fitAutomap()
    this.callbacks.onMapChange(true)
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }
  }

  setTouchInput = (input: Partial<TouchFlightInput>) => {
    if (this.inputMode !== 'touch') return
    this.touchInput = {
      forward: THREE.MathUtils.clamp(
        input.forward ?? this.touchInput.forward,
        -1,
        1,
      ),
      strafe: THREE.MathUtils.clamp(
        input.strafe ?? this.touchInput.strafe,
        -1,
        1,
      ),
      vertical: THREE.MathUtils.clamp(
        input.vertical ?? this.touchInput.vertical,
        -1,
        1,
      ),
    }
  }

  addTouchLook = (deltaX: number, deltaY: number) => {
    if (
      this.inputMode !== 'touch' ||
      this.paused ||
      (this.mode !== 'hunt' && this.mode !== 'escape')
    ) {
      return
    }
    const sensitivity = 0.0032 * this.touchSensitivity
    this.yaw -= deltaX * sensitivity
    this.pitch -= deltaY * sensitivity
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.48, 1.48)
  }

  setTouchFiring = (firing: boolean) => {
    if (this.inputMode !== 'touch') return
    this.firing = firing
  }

  fireTouch = () => {
    if (
      this.inputMode !== 'touch' ||
      this.paused ||
      this.fireCooldown > 0 ||
      (this.mode !== 'hunt' && this.mode !== 'escape')
    ) {
      return
    }
    this.firePlayerProjectile()
  }

  dispose = () => {
    if (this.disposed) return
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('blur', this.handleBlur)
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu)
    this.canvas.removeEventListener('pointerdown', this.handleMapPointerDown)
    this.canvas.removeEventListener('pointermove', this.handleMapPointerMove)
    this.canvas.removeEventListener('pointerup', this.handleMapPointerUp)
    this.canvas.removeEventListener('pointercancel', this.handleMapPointerUp)
    this.canvas.removeEventListener('wheel', this.handleMapWheel)
    document.removeEventListener(
      'pointerlockchange',
      this.handlePointerLockChange,
    )
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    )
    if (this.lockRequestTimer !== undefined) {
      window.clearTimeout(this.lockRequestTimer)
    }
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }

    const materials = new Set<THREE.Material>()
    const geometries = new Set<THREE.BufferGeometry>()
    const textures = new Set<THREE.Texture>()
    this.scene.traverse((object) => {
      const hasGeometry =
        object instanceof THREE.Mesh ||
        object instanceof THREE.Line ||
        object instanceof THREE.Points
      if (hasGeometry) geometries.add(object.geometry)
      if (!(hasGeometry || object instanceof THREE.Sprite)) return
      const objectMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      objectMaterials.forEach((material) => materials.add(material))
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => {
      const map = (material as THREE.Material & { map?: THREE.Texture | null })
        .map
      if (map) textures.add(map)
      material.dispose()
    })
    textures.forEach((texture) => texture.dispose())
    disposeStackTraceAutomap(this.automap)
    this.audio.dispose()
    this.renderer.dispose()
  }

  private readonly resize = () => {
    const parent = this.canvas.parentElement
    const width = Math.max(parent?.clientWidth ?? window.innerWidth, 1)
    const height = Math.max(parent?.clientHeight ?? window.innerHeight, 1)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.automap.camera.aspect = width / height
    this.automap.camera.updateProjectionMatrix()
    if (this.mapOpen) this.fitAutomap()
  }

  private applyRendererPixelRatio() {
    const mobileRendering = this.likelyTouchDevice || this.inputMode === 'touch'
    const cap = mobileRendering ? 1.25 : 1.6
    this.renderer?.setPixelRatio(
      Math.min(window.devicePixelRatio, cap) * this.renderScale,
    )
  }

  private updateAdaptiveRendering(frameDelta: number) {
    if (this.inputMode !== 'touch' || this.renderScale <= 0.72) return
    this.performanceElapsed += frameDelta
    this.performanceFrames += 1
    if (this.performanceElapsed < 2.5) return

    const framesPerSecond =
      this.performanceFrames / Math.max(this.performanceElapsed, 0.001)
    if (framesPerSecond < 45) {
      this.renderScale = Math.max(0.72, this.renderScale - 0.14)
      this.applyRendererPixelRatio()
      this.resize()
    }
    this.performanceElapsed = 0
    this.performanceFrames = 0
  }

  private resetTouchInput() {
    this.touchInput = { forward: 0, strafe: 0, vertical: 0 }
  }

  private escapeDuration() {
    return this.inputMode === 'touch'
      ? TOUCH_ESCAPE_DURATION
      : DESKTOP_ESCAPE_DURATION
  }

  private addZoneLight(color: string, position: THREE.Vector3) {
    const light = new THREE.PointLight(color, 22, 30, 1.7)
    light.position.copy(position)
    this.scene.add(light)
  }

  private createProjectilePool() {
    const playerGeometry = new THREE.SphereGeometry(0.065, 8, 8)
    const enemyGeometry = new THREE.SphereGeometry(0.1, 6, 6)
    const playerTailLength = 1.35
    const playerTailGeometry = new THREE.CylinderGeometry(
      0.05,
      0.004,
      playerTailLength,
      8,
      1,
      true,
    )
    playerTailGeometry.translate(0, -playerTailLength / 2, 0)
    const playerMaterial = new THREE.MeshBasicMaterial({
      color: '#d9ff43',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const playerTailMaterial = new THREE.MeshBasicMaterial({
      color: '#d9ff43',
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    const enemyMaterial = new THREE.MeshBasicMaterial({
      color: '#ff694a',
      toneMapped: false,
    })

    for (let index = 0; index < 72; index += 1) {
      const owner = index < 38 ? 'player' : 'enemy'
      const mesh = new THREE.Mesh(
        owner === 'player' ? playerGeometry : enemyGeometry,
        owner === 'player' ? playerMaterial : enemyMaterial,
      )
      if (owner === 'player') {
        mesh.add(new THREE.Mesh(playerTailGeometry, playerTailMaterial))
      }
      mesh.visible = false
      this.scene.add(mesh)
      this.projectiles.push({
        mesh,
        owner,
        position: new THREE.Vector3(),
        visualOffset: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        active: false,
        life: 0,
      })
    }
  }

  private createBurstPool() {
    const burstCount = this.likelyTouchDevice ? 6 : 10
    const particleCount = this.likelyTouchDevice ? 12 : 18
    for (let burstIndex = 0; burstIndex < burstCount; burstIndex += 1) {
      const positions = new Float32Array(particleCount * 3)
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const material = new THREE.PointsMaterial({
        color: '#ff694a',
        size: 0.2,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
      const points = new THREE.Points(geometry, material)
      points.visible = false
      this.scene.add(points)
      this.bursts.push({
        points,
        positions,
        velocities: Array.from({ length: particleCount }, () =>
          new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
          )
            .normalize()
            .multiplyScalar(2.5 + Math.random() * 4),
        ),
        material,
        active: false,
        life: 0,
      })
    }
  }

  private resetMission() {
    this.mode = 'idle'
    this.paused = true
    this.mapOpen = false
    this.mapPointerId = null
    this.discoveredRooms.clear()
    this.discoveredRooms.add('surface')
    this.discoveredTunnels.clear()
    this.doorLocked = true
    this.firing = false
    this.keys.clear()
    this.yaw = 0
    this.pitch = 0
    this.roll = 0
    this.elapsed = 0
    this.escapeTime = this.escapeDuration()
    this.fireCooldown = 0
    this.objectiveRefreshCooldown = 0
    this.hudRefreshCooldown = 0
    this.playerDamageCooldown = 0
    this.shotsFired = 0
    this.shotsHit = 0
    this.bugsPurged = 0
    this.hitPulse = 0
    this.damagePulse = 0
    this.integrity = 100
    this.objectiveFromRoom = null
    this.performanceElapsed = 0
    this.performanceFrames = 0
    this.resetTouchInput()
    this.velocity.set(0, 0, 0)
    this.camera.position.copy(startPosition)
    this.camera.rotation.set(0, 0, 0, 'YXZ')
    this.world.door.group.visible = true
    this.exit.group.visible = false
    this.exit.group.scale.setScalar(1)

    this.faults.forEach((fault) => {
      fault.health = fault.maxHealth
      fault.alive = true
      fault.visual.group.visible = true
      fault.visual.group.scale.setScalar(1)
      setObjectOpacity(fault.visual.group, 1)
    })
    this.enemies.forEach((enemy) => {
      enemy.health = enemy.maxHealth
      enemy.alive = true
      enemy.lastShot = -10
      enemy.collisionCooldown = 0
      enemy.visual.group.visible = true
      enemy.visual.group.position.copy(enemy.home)
      setObjectOpacity(enemy.visual.group, 1)
    })
    this.root.health = this.root.maxHealth
    this.root.alive = true
    this.root.lastShot = -10
    this.root.visual.group.visible = true
    this.root.visual.group.scale.setScalar(1)
    setObjectOpacity(this.root.visual.group, 1)
    this.syncAutomap()
    this.projectiles.forEach((projectile) =>
      this.deactivateProjectile(projectile),
    )
    this.bursts.forEach((burst) => {
      burst.active = false
      burst.points.visible = false
      burst.material.opacity = 0
    })
    this.refreshObjective(true)
  }

  private requestPointerLock() {
    try {
      this.canvas.focus()
      void this.canvas.requestPointerLock().catch(() => {
        if (this.mode !== 'hunt' && this.mode !== 'escape') return
        this.paused = true
        this.callbacks.onPauseChange(true)
      })
      if (this.lockRequestTimer !== undefined) {
        window.clearTimeout(this.lockRequestTimer)
      }
      this.lockRequestTimer = window.setTimeout(() => {
        if (
          document.pointerLockElement !== this.canvas &&
          (this.mode === 'hunt' || this.mode === 'escape')
        ) {
          this.paused = true
          this.callbacks.onPauseChange(true)
        }
      }, 350)
    } catch {
      this.paused = true
      this.callbacks.onPauseChange(true)
    }
  }

  private readonly handlePointerLockChange = () => {
    if (this.inputMode !== 'pointer') return
    if (this.mode !== 'hunt' && this.mode !== 'escape') return
    if (this.mapOpen) return
    const wasPaused = this.paused
    this.paused = document.pointerLockElement !== this.canvas
    if (this.paused) {
      this.firing = false
      this.keys.clear()
    }
    if (this.paused && !wasPaused) this.audio.playPause()
    this.callbacks.onPauseChange(this.paused)
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (this.mode !== 'hunt' && this.mode !== 'escape') return
    if (
      !event.repeat &&
      (event.code === 'KeyM' || (this.mapOpen && event.code === 'Escape'))
    ) {
      event.preventDefault()
      this.toggleMap()
      return
    }
    if (this.mapOpen) {
      event.preventDefault()
      return
    }
    if (
      [
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyQ',
        'KeyE',
        'Space',
        'KeyC',
      ].includes(event.code)
    ) {
      event.preventDefault()
    }
    this.keys.add(event.code)
  }

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
  }

  private readonly handleMouseDown = (event: MouseEvent) => {
    if (
      event.button === 0 &&
      document.pointerLockElement === this.canvas &&
      (this.mode === 'hunt' || this.mode === 'escape')
    ) {
      this.firing = true
    }
  }

  private readonly handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0) this.firing = false
  }

  private readonly handleMouseMove = (event: MouseEvent) => {
    if (
      this.inputMode !== 'pointer' ||
      document.pointerLockElement !== this.canvas ||
      (this.mode !== 'hunt' && this.mode !== 'escape')
    ) {
      return
    }
    this.yaw -= event.movementX * 0.00165
    this.pitch -= event.movementY * 0.00165
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.48, 1.48)
  }

  private readonly handleBlur = () => {
    this.firing = false
    this.keys.clear()
    this.resetTouchInput()
  }

  private readonly handleVisibilityChange = () => {
    if (document.hidden && (this.mode === 'hunt' || this.mode === 'escape')) {
      this.pause()
    }
  }

  private readonly handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
  }

  private readonly handleMapPointerDown = (event: PointerEvent) => {
    if (!this.mapOpen || this.mapPointerId !== null) return
    this.mapPointerId = event.pointerId
    this.mapPointerX = event.clientX
    this.mapPointerY = event.clientY
    this.canvas.setPointerCapture(event.pointerId)
  }

  private readonly handleMapPointerMove = (event: PointerEvent) => {
    if (!this.mapOpen || this.mapPointerId !== event.pointerId) return
    const deltaX = event.clientX - this.mapPointerX
    const deltaY = event.clientY - this.mapPointerY
    this.mapPointerX = event.clientX
    this.mapPointerY = event.clientY
    this.mapOrbitYaw += deltaX * 0.006
    this.mapOrbitPitch = THREE.MathUtils.clamp(
      this.mapOrbitPitch + deltaY * 0.005,
      -1.3,
      1.3,
    )
  }

  private readonly handleMapPointerUp = (event: PointerEvent) => {
    if (this.mapPointerId !== event.pointerId) return
    this.mapPointerId = null
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
  }

  private readonly handleMapWheel = (event: WheelEvent) => {
    if (!this.mapOpen) return
    event.preventDefault()
    this.mapDistance = THREE.MathUtils.clamp(
      this.mapDistance * Math.exp(event.deltaY * 0.001),
      18,
      220,
    )
  }

  private readonly animate = () => {
    const frameDelta = this.clock.getDelta()
    const delta = Math.min(frameDelta, 0.04)
    const time = this.clock.elapsedTime
    this.updateAdaptiveRendering(frameDelta)
    this.animateWorld(time, delta)

    if (!this.paused && (this.mode === 'hunt' || this.mode === 'escape')) {
      this.elapsed += delta
      this.fireCooldown = Math.max(0, this.fireCooldown - delta)
      this.objectiveRefreshCooldown -= delta
      this.hudRefreshCooldown -= delta
      this.playerDamageCooldown = Math.max(0, this.playerDamageCooldown - delta)
      this.updateMovement(delta)
      this.updateEnemies(time, delta)
      this.updateProjectiles(delta)
      this.updateBursts(delta)

      if (this.firing && this.fireCooldown <= 0) this.firePlayerProjectile()
      if (this.objectiveRefreshCooldown <= 0) {
        this.refreshObjective()
        this.objectiveRefreshCooldown = 0.3
      }
      if (this.mode === 'escape') {
        this.escapeTime = Math.max(0, this.escapeTime - delta)
        if (this.camera.position.distanceTo(exitPosition) < 3.2) {
          this.finishMission('won', 'Stack resolved. Build shipped.')
        } else if (this.escapeTime <= 0) {
          this.finishMission('failed', 'Deployment rolled back.')
        }
      }
      if (this.hudRefreshCooldown <= 0) {
        this.emitHud()
        this.hudRefreshCooldown = 0.1
      }
    } else {
      this.updateBursts(delta)
    }

    if (this.mapOpen) {
      this.renderAutomap()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  private updateMapDiscovery() {
    this.world.rooms.forEach((room, roomId) => {
      const [x, y, z] = room.center
      if (
        Math.abs(this.camera.position.x - x) <= MAP_CHAMBER_HALF &&
        Math.abs(this.camera.position.y - y) <= MAP_CHAMBER_HALF &&
        Math.abs(this.camera.position.z - z) <= MAP_CHAMBER_HALF
      ) {
        this.discoveredRooms.add(roomId)
      }
    })

    connections.forEach(([fromId, toId], index) => {
      const from = this.world.rooms.get(fromId)
      const to = this.world.rooms.get(toId)
      if (!from || !to) return
      const fromCenter = from.center
      const toCenter = to.center
      const axisIndex =
        fromCenter[0] !== toCenter[0]
          ? 0
          : fromCenter[1] !== toCenter[1]
            ? 1
            : 2
      const coordinate = this.camera.position.getComponent(axisIndex)
      const minimum =
        Math.min(fromCenter[axisIndex], toCenter[axisIndex]) + MAP_CHAMBER_HALF
      const maximum =
        Math.max(fromCenter[axisIndex], toCenter[axisIndex]) - MAP_CHAMBER_HALF
      if (coordinate < minimum || coordinate > maximum) return

      const transverseAxes = [0, 1, 2].filter(
        (candidate) => candidate !== axisIndex,
      )
      const transverseDistance = Math.hypot(
        this.camera.position.getComponent(transverseAxes[0] ?? 0) -
          fromCenter[transverseAxes[0] ?? 0],
        this.camera.position.getComponent(transverseAxes[1] ?? 1) -
          fromCenter[transverseAxes[1] ?? 1],
      )
      if (transverseDistance <= MAP_TUNNEL_RADIUS) {
        this.discoveredTunnels.add(index)
      }
    })
  }

  private fitAutomap() {
    this.mapBounds.makeEmpty()
    this.world.rooms.forEach((room) => {
      this.mapCameraOffset.set(...room.center)
      this.mapBounds.expandByPoint(this.mapCameraOffset)
    })
    this.mapBounds.expandByPoint(this.camera.position)
    this.mapBounds.expandByScalar(6)
    this.mapBounds.getCenter(this.mapCenter)
    this.mapBounds.getSize(this.mapBoundsSize)

    const verticalFov = THREE.MathUtils.degToRad(this.automap.camera.fov)
    const horizontalFov =
      2 *
      Math.atan(
        Math.tan(verticalFov / 2) * Math.max(this.automap.camera.aspect, 0.1),
      )
    const fittingFov = Math.min(verticalFov, horizontalFov)
    const radius = Math.max(this.mapBoundsSize.length() / 2, 8)
    this.mapDistance = THREE.MathUtils.clamp(
      (radius / Math.sin(fittingFov / 2)) * 1.08,
      28,
      220,
    )
  }

  private syncAutomap() {
    updateStackTraceAutomap(
      this.automap,
      this.discoveredRooms,
      this.discoveredTunnels,
      this.camera.position,
      this.camera.quaternion,
    )
    this.automap.enemies.forEach((marker, index) => {
      const enemy = this.enemies[index]
      marker.visible = enemy?.alive ?? false
      if (enemy) marker.position.copy(enemy.visual.group.position)
    })
    this.automap.faults.forEach((marker, index) => {
      const fault = this.faults[index]
      marker.visible = fault?.alive ?? false
      if (fault) marker.position.copy(fault.visual.group.position)
    })
    this.automap.rootEnemy.visible = this.root.alive
    this.automap.rootEnemy.position.copy(rootPosition)
    this.automap.exit.visible = this.mode === 'escape'
  }

  private renderAutomap() {
    this.syncAutomap()
    const horizontalDistance = Math.cos(this.mapOrbitPitch) * this.mapDistance
    this.mapCameraOffset.set(
      Math.cos(this.mapOrbitYaw) * horizontalDistance,
      Math.sin(this.mapOrbitPitch) * this.mapDistance,
      Math.sin(this.mapOrbitYaw) * horizontalDistance,
    )
    this.automap.camera.position.copy(this.mapCenter).add(this.mapCameraOffset)
    this.automap.camera.up.set(0, 1, 0)
    this.automap.camera.lookAt(this.mapCenter)
    this.renderer.render(this.automap.scene, this.automap.camera)
  }

  private animateWorld(time: number, delta: number) {
    this.world.door.group.children.forEach((child, index) => {
      child.scale.y = 0.85 + Math.sin(time * 5 + index) * 0.15
    })

    this.faults.forEach((fault, index) => {
      if (!fault.alive) return
      fault.visual.core.rotation.x += delta * (0.35 + index * 0.08)
      fault.visual.core.rotation.y -= delta * 0.5
      fault.visual.shell.rotation.y += delta * (0.25 + index * 0.04)
      const pulse = 1 + Math.sin(time * 3 + index) * 0.045
      fault.visual.group.scale.setScalar(pulse)
    })
    this.enemies.forEach((enemy, enemyIndex) => {
      if (!enemy.alive) return
      enemy.visual.icon.material.rotation =
        Math.sin(time * 2.8 + enemyIndex) * 0.055
    })
    if (this.root.alive) {
      this.root.visual.icon.material.rotation = Math.sin(time * 1.8) * 0.04
      this.root.visual.rings.forEach((ring, index) => {
        ring.rotation.z += delta * (0.2 + index * 0.12)
      })
      const rootPulse = 1 + Math.sin(time * 2.4) * 0.035
      this.root.visual.group.scale.setScalar(rootPulse)
    }
    if (this.exit.group.visible) {
      const exitPulse = 1 + Math.sin(time * 6) * 0.08
      this.exit.group.scale.setScalar(exitPulse)
      const material = this.exit.field.material
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.07 + (Math.sin(time * 6) + 1) * 0.035
      }
    }
  }

  private updateMovement(delta: number) {
    const rollInput =
      this.inputMode === 'touch'
        ? 0
        : (this.keys.has('KeyE') ? 1 : 0) - (this.keys.has('KeyQ') ? 1 : 0)
    if (rollInput !== 0) {
      this.roll += rollInput * delta * 1.25
      this.roll = THREE.MathUtils.clamp(this.roll, -0.62, 0.62)
    } else {
      this.roll = THREE.MathUtils.damp(this.roll, 0, 4.5, delta)
    }
    this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ')

    this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
    this.right.set(1, 0, 0).applyQuaternion(this.camera.quaternion)
    this.up.set(0, 1, 0).applyQuaternion(this.camera.quaternion)
    this.moveVector.set(0, 0, 0)
    const forwardInput =
      (this.keys.has('KeyW') ? 1 : 0) -
      (this.keys.has('KeyS') ? 1 : 0) +
      this.touchInput.forward
    const strafeInput =
      (this.keys.has('KeyD') ? 1 : 0) -
      (this.keys.has('KeyA') ? 1 : 0) +
      this.touchInput.strafe
    const verticalInput =
      (this.keys.has('Space') ? 1 : 0) -
      (this.keys.has('KeyC') ? 1 : 0) +
      this.touchInput.vertical
    this.moveVector.addScaledVector(
      this.forward,
      THREE.MathUtils.clamp(forwardInput, -1, 1),
    )
    this.moveVector.addScaledVector(
      this.right,
      THREE.MathUtils.clamp(strafeInput, -1, 1),
    )
    this.moveVector.addScaledVector(
      this.up,
      THREE.MathUtils.clamp(verticalInput, -1, 1),
    )
    if (this.moveVector.lengthSq() > 0) {
      this.moveVector.normalize()
      this.velocity.addScaledVector(
        this.moveVector,
        PLAYER_ACCELERATION * delta,
      )
    }
    const damping = Math.exp(-4.5 * delta)
    this.velocity.multiplyScalar(damping)
    if (this.velocity.length() > PLAYER_SPEED) {
      this.velocity.setLength(PLAYER_SPEED)
    }

    const movement = this.moveVector.copy(this.velocity).multiplyScalar(delta)
    ;(['x', 'y', 'z'] as const).forEach((axis) => {
      this.candidate.copy(this.camera.position)
      this.candidate[axis] += movement[axis]
      if (this.canOccupy(this.candidate, PLAYER_RADIUS)) {
        this.camera.position[axis] = this.candidate[axis]
      } else {
        this.velocity[axis] = 0
      }
    })
    this.updateMapDiscovery()
  }

  private canOccupy(position: THREE.Vector3, radius: number) {
    if (
      this.doorLocked &&
      this.world.door.bounds.distanceToPoint(position) < radius
    ) {
      return false
    }
    return this.world.volumes.some((volume) => {
      if (volume.kind === 'box') {
        return (
          position.x >= volume.bounds.min.x + radius &&
          position.x <= volume.bounds.max.x - radius &&
          position.y >= volume.bounds.min.y + radius &&
          position.y <= volume.bounds.max.y - radius &&
          position.z >= volume.bounds.min.z + radius &&
          position.z <= volume.bounds.max.z - radius
        )
      }

      const axialPosition = position[volume.axis]
      if (axialPosition < volume.min || axialPosition > volume.max) return false
      const transverseDistance =
        volume.axis === 'x'
          ? Math.hypot(
              position.y - volume.center.y,
              position.z - volume.center.z,
            )
          : volume.axis === 'y'
            ? Math.hypot(
                position.x - volume.center.x,
                position.z - volume.center.z,
              )
            : Math.hypot(
                position.x - volume.center.x,
                position.y - volume.center.y,
              )
      return transverseDistance + radius <= volume.radius
    })
  }

  private updateEnemies(time: number, delta: number) {
    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return
      enemy.collisionCooldown = Math.max(0, enemy.collisionCooldown - delta)
      const position = enemy.visual.group.position
      const distance = position.distanceTo(this.camera.position)

      if (enemy.spec.kind === 'wisp' && distance < 15 && distance > 1.2) {
        this.moveVector
          .copy(this.camera.position)
          .sub(position)
          .normalize()
          .multiplyScalar(delta * (this.inputMode === 'touch' ? 1.05 : 1.45))
        this.candidate.copy(position).add(this.moveVector)
        if (this.canOccupy(this.candidate, 0.72)) {
          position.copy(this.candidate)
        }
      }

      const fireInterval =
        (enemy.spec.kind === 'crawler' ? 1.65 : 2.25) *
        (this.inputMode === 'touch' ? 1.35 : 1)
      if (distance < 17 && time - enemy.lastShot > fireInterval) {
        this.forward.copy(this.camera.position).sub(position).normalize()
        this.spawnProjectile(
          'enemy',
          position,
          this.forward,
          enemy.spec.kind === 'crawler' ? 10 : 8,
        )
        this.audio.playEnemyShot(1 - distance / 17)
        enemy.lastShot = time
      }

      if (distance < 1.25 && enemy.collisionCooldown <= 0) {
        this.damagePlayer(this.inputMode === 'touch' ? 10 : 14)
        enemy.collisionCooldown = 1.1
        this.forward.copy(position).sub(this.camera.position).normalize()
        this.candidate.copy(position).addScaledVector(this.forward, 2)
        if (this.canOccupy(this.candidate, 0.72)) position.copy(this.candidate)
      }
    })

    if (
      !this.doorLocked &&
      this.root.alive &&
      this.camera.position.distanceTo(rootPosition) < 20 &&
      time - this.root.lastShot > (this.inputMode === 'touch' ? 1.55 : 1.15)
    ) {
      this.forward.copy(this.camera.position).sub(rootPosition).normalize()
      this.spawnProjectile('enemy', rootPosition, this.forward, 11)
      this.audio.playEnemyShot(
        1 - this.camera.position.distanceTo(rootPosition) / 20,
      )
      this.root.lastShot = time
    }
  }

  private firePlayerProjectile() {
    this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
    if (this.inputMode === 'touch') this.applyTouchAimAssist()
    this.candidate.copy(this.camera.position).addScaledVector(this.forward, 0.9)
    this.up
      .set(0, -1, 0)
      .applyQuaternion(this.camera.quaternion)
      .multiplyScalar(0.58)
    this.spawnProjectile('player', this.candidate, this.forward, 32, this.up)
    this.audio.playPlayerShot()
    this.shotsFired += 1
    this.fireCooldown = SHOT_COOLDOWN
  }

  private applyTouchAimAssist() {
    let bestAlignment = 0.972
    this.aimDirection.copy(this.forward)
    const considerTarget = (position: THREE.Vector3) => {
      if (position.distanceToSquared(this.camera.position) > 30 * 30) return
      this.right.copy(position).sub(this.camera.position).normalize()
      const alignment = this.forward.dot(this.right)
      if (alignment <= bestAlignment) return
      bestAlignment = alignment
      this.aimDirection.copy(this.right)
    }

    this.enemies.forEach((enemy) => {
      if (enemy.alive) considerTarget(enemy.visual.group.position)
    })
    this.faults.forEach((fault) => {
      if (fault.alive) considerTarget(fault.visual.group.position)
    })
    if (!this.doorLocked && this.root.alive) considerTarget(rootPosition)
    if (bestAlignment > 0.972) {
      this.forward.lerp(this.aimDirection, 0.32).normalize()
    }
  }

  private spawnProjectile(
    owner: Projectile['owner'],
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    visualOffset?: THREE.Vector3,
  ) {
    const projectile = this.projectiles.find(
      (item) => !item.active && item.owner === owner,
    )
    if (!projectile) return
    projectile.active = true
    projectile.life = owner === 'player' ? 2.2 : 3.2
    projectile.mesh.visible = true
    projectile.position.copy(origin)
    if (visualOffset) {
      projectile.visualOffset.copy(visualOffset)
    } else {
      projectile.visualOffset.set(0, 0, 0)
    }
    projectile.mesh.position
      .copy(projectile.position)
      .add(projectile.visualOffset)
    projectile.mesh.quaternion.setFromUnitVectors(PROJECTILE_AXIS, direction)
    projectile.velocity.copy(direction).multiplyScalar(speed)
  }

  private deactivateProjectile(projectile: Projectile) {
    projectile.active = false
    projectile.life = 0
    projectile.mesh.visible = false
    projectile.position.set(0, 0, 0)
    projectile.visualOffset.set(0, 0, 0)
    projectile.velocity.set(0, 0, 0)
  }

  private updateProjectiles(delta: number) {
    this.projectiles.forEach((projectile) => {
      if (!projectile.active) return
      this.previousProjectilePosition.copy(projectile.position)
      projectile.position.addScaledVector(projectile.velocity, delta)
      projectile.visualOffset.multiplyScalar(Math.exp(-5.5 * delta))
      projectile.mesh.position
        .copy(projectile.position)
        .add(projectile.visualOffset)
      projectile.life -= delta
      if (projectile.life <= 0 || !this.canOccupy(projectile.position, 0.08)) {
        this.deactivateProjectile(projectile)
        return
      }

      this.segment.set(this.previousProjectilePosition, projectile.position)
      if (projectile.owner === 'enemy') {
        this.segment.closestPointToPoint(
          this.camera.position,
          true,
          this.closestPoint,
        )
        if (this.closestPoint.distanceTo(this.camera.position) < 0.72) {
          this.damagePlayer(this.inputMode === 'touch' ? 8 : 11)
          this.deactivateProjectile(projectile)
        }
        return
      }

      const hitEnemy = this.enemies.find(
        (enemy) =>
          enemy.alive &&
          this.segmentDistanceTo(enemy.visual.group.position) <
            (this.inputMode === 'touch' ? 1.15 : 0.9),
      )
      if (hitEnemy) {
        this.shotsHit += 1
        this.hitPulse += 1
        this.audio.playImpact()
        this.touchImpactFeedback()
        hitEnemy.health -= 1
        if (hitEnemy.health <= 0) {
          hitEnemy.alive = false
          hitEnemy.visual.group.visible = false
          this.bugsPurged += 1
          this.audio.playDestroy()
          this.spawnBurst(
            hitEnemy.visual.group.position,
            hitEnemy.spec.kind === 'crawler' ? '#ff694a' : '#d9ff43',
          )
        }
        this.deactivateProjectile(projectile)
        return
      }

      const hitFault = this.faults.find(
        (fault) =>
          fault.alive &&
          this.segmentDistanceTo(fault.visual.group.position) <
            (this.inputMode === 'touch' ? 1.6 : 1.35),
      )
      if (hitFault) {
        this.shotsHit += 1
        this.hitPulse += 1
        this.audio.playImpact()
        this.touchImpactFeedback()
        hitFault.health -= 1
        const scale = THREE.MathUtils.lerp(
          0.65,
          1,
          hitFault.health / hitFault.maxHealth,
        )
        hitFault.visual.group.scale.setScalar(scale)
        if (hitFault.health <= 0) {
          hitFault.alive = false
          hitFault.visual.group.visible = false
          this.bugsPurged += 1
          this.audio.playDestroy()
          this.spawnBurst(hitFault.visual.group.position, '#ff694a')
          if (this.faults.every((fault) => !fault.alive)) {
            this.doorLocked = false
            this.world.door.group.visible = false
            this.audio.playObjectiveResolved()
          }
          this.refreshObjective(true)
          this.emitHud()
        }
        this.deactivateProjectile(projectile)
        return
      }

      if (
        !this.doorLocked &&
        this.root.alive &&
        this.segmentDistanceTo(rootPosition) <
          (this.inputMode === 'touch' ? 2.7 : 2.35)
      ) {
        this.shotsHit += 1
        this.hitPulse += 1
        this.audio.playImpact()
        this.touchImpactFeedback()
        this.root.health -= 1
        if (this.root.health <= 0) {
          this.root.alive = false
          this.root.visual.group.visible = false
          this.bugsPurged += 1
          this.audio.playDestroy(true)
          this.spawnBurst(rootPosition, '#8da4ff')
          this.beginEscape()
        }
        this.deactivateProjectile(projectile)
      }
    })
  }

  private segmentDistanceTo(position: THREE.Vector3) {
    this.segment.closestPointToPoint(position, true, this.closestPoint)
    return this.closestPoint.distanceTo(position)
  }

  private touchImpactFeedback() {
    if (this.inputMode === 'touch' && 'vibrate' in navigator) {
      navigator.vibrate(12)
    }
  }

  private damagePlayer(amount: number) {
    if (this.playerDamageCooldown > 0) return
    this.playerDamageCooldown = 0.42
    this.damagePulse += 1
    this.audio.playDamage()
    const integrity = this.currentIntegrity() - amount
    this.setCurrentIntegrity(integrity)
    this.emitHud()
    if (integrity <= 0) {
      this.finishMission('failed', 'Build integrity lost.')
    }
  }

  private integrity = 100

  private currentIntegrity() {
    return this.integrity
  }

  private setCurrentIntegrity(value: number) {
    this.integrity = THREE.MathUtils.clamp(value, 0, 100)
  }

  private spawnBurst(position: THREE.Vector3, color: string) {
    const burst = this.bursts.find((item) => !item.active)
    if (!burst) return
    burst.active = true
    burst.life = 0.75
    burst.points.visible = true
    burst.points.position.copy(position)
    burst.material.color.set(color)
    burst.material.opacity = 1
    burst.positions.fill(0)
    burst.velocities.forEach((velocity) => {
      velocity
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(2.5 + Math.random() * 4)
    })
    const attribute = burst.points.geometry.getAttribute('position')
    if (attribute instanceof THREE.BufferAttribute) attribute.needsUpdate = true
  }

  private updateBursts(delta: number) {
    this.bursts.forEach((burst) => {
      if (!burst.active) return
      burst.life -= delta
      burst.velocities.forEach((velocity, index) => {
        const offset = index * 3
        burst.positions[offset] =
          (burst.positions[offset] ?? 0) + velocity.x * delta
        burst.positions[offset + 1] =
          (burst.positions[offset + 1] ?? 0) + velocity.y * delta
        burst.positions[offset + 2] =
          (burst.positions[offset + 2] ?? 0) + velocity.z * delta
        velocity.multiplyScalar(Math.exp(-2.4 * delta))
      })
      burst.material.opacity = THREE.MathUtils.clamp(burst.life / 0.75, 0, 1)
      const attribute = burst.points.geometry.getAttribute('position')
      if (attribute instanceof THREE.BufferAttribute)
        attribute.needsUpdate = true
      if (burst.life <= 0) {
        burst.active = false
        burst.points.visible = false
      }
    })
  }

  private beginEscape() {
    this.mode = 'escape'
    this.escapeTime = this.escapeDuration()
    this.exit.group.visible = true
    this.audio.playEscape()
    this.refreshObjective(true)
    this.emitHud()
  }

  private finishMission(status: GameResult['status'], reason: string) {
    if (this.mode === 'won' || this.mode === 'failed') return
    this.mode = status
    this.paused = true
    this.firing = false
    this.keys.clear()
    this.audio.playMissionEnd(status)
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock()
    }
    const accuracy =
      this.shotsFired === 0 ? 0 : (this.shotsHit / this.shotsFired) * 100
    const score = Math.max(
      0,
      Math.round(
        (status === 'won' ? 5000 : 500) +
          this.currentIntegrity() * 24 +
          this.bugsPurged * 140 +
          this.faultsResolved() * 350 +
          (status === 'won' ? this.escapeTime * 55 : 0) +
          accuracy * 8,
      ),
    )
    this.emitHud()
    this.callbacks.onEnd({
      status,
      reason,
      score,
      elapsed: this.elapsed,
      integrity: this.currentIntegrity(),
      bugsPurged: this.bugsPurged,
      faultsResolved: this.faultsResolved(),
      accuracy,
    })
  }

  private nearestRoomId(position: THREE.Vector3) {
    let nearest: RoomId = 'surface'
    let nearestDistance = Number.POSITIVE_INFINITY
    this.world.rooms.forEach((room, roomId) => {
      const distance = position.distanceToSquared(
        this.candidate.set(...room.center),
      )
      if (distance < nearestDistance) {
        nearest = roomId
        nearestDistance = distance
      }
    })
    return nearest
  }

  private routeBetween(from: RoomId, to: RoomId) {
    const queue: Array<RoomId> = [from]
    const previous = new Map<RoomId, RoomId | null>([[from, null]])
    while (queue.length > 0) {
      const room = queue.shift()
      if (!room || room === to) break
      ;(this.world.graph.get(room) ?? []).forEach((neighbor) => {
        if (previous.has(neighbor)) return
        previous.set(neighbor, room)
        queue.push(neighbor)
      })
    }
    const route: Array<RoomId> = []
    let cursor: RoomId | null = to
    while (cursor) {
      route.unshift(cursor)
      cursor = previous.get(cursor) ?? null
    }
    return route[0] === from ? route : [from]
  }

  private findTarget(fromRoom: RoomId) {
    if (this.mode === 'escape') {
      return {
        roomId: 'surface' as const,
        position: exitPosition,
        label: 'Stack unwinding — return to /surface',
        faultId: null,
      }
    }
    const aliveFaults = this.faults.filter((fault) => fault.alive)
    if (aliveFaults.length === 0) {
      return {
        roomId: 'deploy' as const,
        position: rootPosition,
        label: 'Root cause located — destroy /deploy/core',
        faultId: null,
      }
    }
    const target = [...aliveFaults].sort((a, b) => {
      const routeA = this.routeBetween(fromRoom, a.spec.roomId).length
      const routeB = this.routeBetween(fromRoom, b.spec.roomId).length
      if (routeA !== routeB) return routeA - routeB
      return (
        this.camera.position.distanceToSquared(
          this.candidate.set(
            a.spec.position[0],
            a.spec.position[1],
            a.spec.position[2],
          ),
        ) -
        this.camera.position.distanceToSquared(
          this.candidate.set(
            b.spec.position[0],
            b.spec.position[1],
            b.spec.position[2],
          ),
        )
      )
    })[0]
    if (!target) {
      return {
        roomId: 'deploy' as const,
        position: rootPosition,
        label: 'Root cause located — destroy /deploy/core',
        faultId: null,
      }
    }
    return {
      roomId: target.spec.roomId,
      position: target.visual.group.position,
      label: `Trace and purge ${target.spec.frame}`,
      faultId: target.spec.id,
    }
  }

  private refreshObjective(force = false) {
    const fromRoom = this.nearestRoomId(this.camera.position)
    const target = this.findTarget(fromRoom)
    if (
      !force &&
      fromRoom === this.objectiveFromRoom &&
      target.faultId === this.currentTargetFaultId &&
      target.position.equals(this.currentTargetPosition)
    ) {
      return
    }
    this.objectiveFromRoom = fromRoom
    this.currentTargetFaultId = target.faultId
    this.currentTargetPosition.copy(target.position)
    this.currentTargetLabel = target.label
  }

  private faultsResolved() {
    return this.faults.filter((fault) => !fault.alive).length
  }

  private createFrames(): Array<StackFrame> {
    const frames = this.faults.map((fault, index): StackFrame => {
      const status = !fault.alive
        ? 'resolved'
        : this.currentTargetFaultId === fault.spec.id
          ? 'active'
          : 'pending'
      return {
        number: `0${index + 1}`,
        label: fault.spec.frame,
        status,
      }
    })
    frames.push({
      number: '04',
      label: '/deploy/core',
      status: !this.root.alive
        ? 'resolved'
        : this.faults.every((fault) => !fault.alive)
          ? 'active'
          : 'pending',
    })
    return frames
  }

  private emitHud() {
    this.callbacks.onHudChange({
      phase: this.mode,
      objective: this.currentTargetLabel,
      targetDistance: this.camera.position.distanceTo(
        this.currentTargetPosition,
      ),
      integrity: Math.round(this.currentIntegrity()),
      faultsResolved: this.faultsResolved(),
      totalFaults: this.faults.length,
      bugsPurged: this.bugsPurged,
      escapeTime: this.escapeTime,
      frames: this.createFrames(),
      hitPulse: this.hitPulse,
      damagePulse: this.damagePulse,
    })
  }
}
