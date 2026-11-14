import * as THREE from 'three'
import { drawIcon } from '../iconTexture'
import { Kit, ease } from './kit'

/** The objects that stand for pages in the world, in place of a cube. */
export type ObjectKind =
  | 'stack'
  | 'briefcase'
  | 'gears'
  | 'flask'
  | 'notebook'
  | 'dial'
  | 'pen'
  | 'plane'
  | 'padlock'

/** One frame of an object: how far the pointer is on it, 0 to 1. */
export type Frame = {
  t: number
  delta: number
  /** 0 to 1, smoothed: the pointer is on the object. */
  hover: number
  /** False with reduced motion: the object holds still. */
  motion: boolean
}

export type IconObject = {
  root: THREE.Group
  kit: Kit
  update: (frame: Frame) => void
  /**
   * On hover, the object turns to the camera and stops there, at this
   * angle from face on (radians): a face that has to be read (a dial).
   */
  faceOnHover?: number
}

type Built = Omit<IconObject, 'kit' | 'update'> & {
  update?: (frame: Frame) => void
}

/**
 * Builds an object, in meters, about one meter across and centered on the
 * origin, with its front to +z. The icon scales it to its size.
 */
export function buildObject(kind: ObjectKind, accent: string): IconObject {
  const kit = new Kit(accent)
  const built = BUILDERS[kind](kit)
  return { ...built, kit, update: built.update ?? (() => {}) }
}

const BUILDERS: Record<ObjectKind, (kit: Kit) => Built> = {
  stack,
  briefcase,
  gears,
  flask,
  notebook,
  dial,
  pen,
  plane,
  padlock,
}

const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)

/** Work: three slabs, one for each recent project, with its logo on top. */
function stack(kit: Kit): Built {
  const root = new THREE.Group()
  // Tilted toward the camera, so the tops (and the logos) show.
  const tilt = new THREE.Group()
  tilt.rotation.x = 0.62
  root.add(tilt)
  const body = kit.graphite(0.08)
  const edge = kit.glow(0.9)
  const logos = ['/pico.svg', '/whimcall.png', '/postmaster.webp']
  const slabs = logos.map((src, index) => {
    const slab = new THREE.Group()
    slab.add(kit.box(0.7, 0.08, 0.7, body, 0.025))
    // A line of light around the middle of the edge.
    slab.add(kit.box(0.712, 0.014, 0.712, edge, 0.006))
    const face = kit.image(null)
    const logo = kit.mesh(new THREE.PlaneGeometry(0.54, 0.54), face)
    logo.rotation.x = -Math.PI / 2
    logo.position.y = 0.0415
    slab.add(logo)
    void drawIcon({ type: 'image', src }).then((texture) => {
      face.map = face.emissiveMap = kit.texture(texture)
      face.needsUpdate = true
    })
    // Each slab a little nearer the camera than the one over it, so the
    // lower logos show too.
    slab.position.z = (index - 1) * 0.14
    tilt.add(slab)
    return slab
  })
  return {
    root,
    update: ({ hover }) => {
      // On hover the slabs spread apart.
      const gap = 0.25 + hover * 0.1
      slabs.forEach((slab, index) => (slab.position.y = (1 - index) * gap))
    },
  }
}

/** Experience: a briefcase. On hover its lid opens a little on a glow. */
function briefcase(kit: Kit): Built {
  const root = new THREE.Group()
  const body = kit.graphite(0.05)
  const trim = kit.graphite(0.3)
  const glow = kit.glow()
  const seam = 0.04
  const base = kit.box(0.94, 0.46, 0.32, body, 0.05)
  base.position.y = seam - 0.23
  root.add(base)
  // The light inside, seen when the lid opens.
  const inside = kit.mesh(new THREE.PlaneGeometry(0.84, 0.24), glow)
  inside.rotation.x = -Math.PI / 2
  inside.position.y = seam + 0.002
  root.add(inside)
  // The lid turns about its back edge.
  const hinge = new THREE.Group()
  hinge.position.set(0, seam, -0.16)
  const lid = kit.box(0.94, 0.17, 0.32, body, 0.05)
  lid.position.set(0, 0.085 + 0.004, 0.16)
  hinge.add(lid)
  const handle = kit.mesh(
    new THREE.TorusGeometry(0.13, 0.03, 10, 24, Math.PI),
    trim,
  )
  handle.position.set(0, 0.174, 0.16)
  hinge.add(handle)
  root.add(hinge)
  // A band of light along the seam, and two latches over it.
  const band = kit.box(0.946, 0.012, 0.326, glow, 0.005)
  band.position.y = seam - 0.008
  root.add(band)
  for (const x of [-0.28, 0.28]) {
    const latch = kit.box(0.09, 0.07, 0.03, trim, 0.01)
    latch.position.set(x, seam, 0.165)
    root.add(latch)
  }
  root.position.y = 0.02
  return {
    root,
    update: ({ hover }) => {
      hinge.rotation.x = -0.5 * hover
    },
  }
}

/** A gear, flat in the xy plane: teeth around, a hole in the middle. */
function gearShape(radius: number, teeth: number, hole: number) {
  const shape = new THREE.Shape()
  const step = (Math.PI * 2) / teeth
  const inner = radius - 0.035
  const outer = radius + 0.035
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const points: Array<[number, number]> = [
      [inner, a],
      [outer, a + step * 0.12],
      [outer, a + step * 0.43],
      [inner, a + step * 0.55],
    ]
    for (const [r, angle] of points) {
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0 && angle === a) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
  }
  shape.closePath()
  const gap = new THREE.Path()
  gap.absarc(0, 0, hole, 0, Math.PI * 2, true)
  shape.holes.push(gap)
  return shape
}

/** Skills: two gears that turn together, faster on hover. */
function gears(kit: Kit): Built {
  const root = new THREE.Group()
  const body = kit.graphite(0.12)
  const glow = kit.glow()
  // The teeth are the same size on both gears: teeth in step with radius.
  const big = { radius: 0.3, teeth: 14 }
  const small = { radius: 0.3 * (9 / 14), teeth: 9 }
  const depth = 0.12
  const make = (spec: { radius: number; teeth: number }) => {
    const gear = new THREE.Group()
    const geometry = new THREE.ExtrudeGeometry(
      gearShape(spec.radius, spec.teeth, 0.06),
      {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.014,
        bevelSize: 0.01,
        bevelSegments: 2,
        curveSegments: 16,
      },
    )
    geometry.translate(0, 0, -depth / 2)
    gear.add(kit.mesh(geometry, body))
    // The axle, and a ring of light on the face.
    const axle = kit.mesh(
      new THREE.CylinderGeometry(0.045, 0.045, depth + 0.08, 16),
      glow,
    )
    axle.rotation.x = Math.PI / 2
    gear.add(axle)
    const ring = kit.mesh(
      new THREE.RingGeometry(spec.radius * 0.55, spec.radius * 0.6, 40),
      glow,
    )
    ring.position.z = depth / 2 + 0.016
    gear.add(ring)
    root.add(gear)
    return gear
  }
  const one = make(big)
  const two = make(small)
  // The small gear sits up and to the right, its teeth in the gaps of the
  // big one.
  const angle = THREE.MathUtils.degToRad(38)
  const reach = big.radius + small.radius
  one.position.set(-0.16, -0.12, 0)
  two.position.set(
    one.position.x + Math.cos(angle) * reach,
    one.position.y + Math.sin(angle) * reach,
    0.002,
  )
  const stepOne = (Math.PI * 2) / big.teeth
  const stepTwo = (Math.PI * 2) / small.teeth
  const ratio = big.teeth / small.teeth
  // With the big gear at its start, a tooth points at the small gear,
  // and a gap of the small gear points back at it.
  const startOne = angle - stepOne * 0.275
  const startTwo = angle + Math.PI - stepTwo * 0.775
  let turn = 0
  const place = () => {
    one.rotation.z = startOne + turn
    two.rotation.z = startTwo - turn * ratio
  }
  place()
  return {
    root,
    update: ({ delta, hover, motion }) => {
      if (!motion) return
      turn += delta * (0.35 + hover * 1.6)
      place()
    },
  }
}

/** Lab: a flask of glowing liquid. Bubbles rise in it. */
function flask(kit: Kit): Built {
  const root = new THREE.Group()
  // The profile of the glass, from the middle of the floor to the lip.
  const body = (y: number) => 0.4 - ((y + 0.36) * 0.27) / 0.52
  const glass = kit.mesh(
    new THREE.LatheGeometry(
      [
        v(0, -0.46),
        v(0.34, -0.46),
        v(0.39, -0.43),
        v(0.41, -0.38),
        v(0.13, 0.16),
        v(0.11, 0.21),
        v(0.11, 0.42),
      ].map((p) => new THREE.Vector2(p.x, p.y)),
      40,
    ),
    kit.glass(),
  )
  glass.renderOrder = 1
  root.add(glass)
  const level = -0.08
  const liquid = kit.mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0, -0.44),
        new THREE.Vector2(0.33, -0.44),
        new THREE.Vector2(0.38, -0.4),
        new THREE.Vector2(0.39, -0.36),
        new THREE.Vector2(body(level) - 0.02, level),
        new THREE.Vector2(0, level),
      ],
      40,
    ),
    kit.glow(0.85),
  )
  root.add(liquid)
  // A collar at the lip and a ring at the foot, in graphite.
  const metal = kit.graphite(0.25)
  const lip = kit.mesh(new THREE.TorusGeometry(0.12, 0.024, 10, 32), metal)
  lip.rotation.x = Math.PI / 2
  lip.position.y = 0.42
  root.add(lip)
  const foot = kit.mesh(new THREE.TorusGeometry(0.36, 0.022, 10, 48), metal)
  foot.rotation.x = Math.PI / 2
  foot.position.y = -0.455
  root.add(foot)
  // Bubbles: each rises from the floor to the top of the liquid, then
  // starts again.
  const bubbleGlow = kit.glow(1.4)
  const bubbles = Array.from({ length: 7 }, (_, index) => {
    const mesh = kit.mesh(new THREE.SphereGeometry(1, 10, 8), bubbleGlow)
    const angle = index * 2.4
    const out = 0.06 + ((index * 37) % 10) / 50
    return {
      mesh,
      x: Math.cos(angle) * out,
      z: Math.sin(angle) * out,
      size: 0.018 + ((index * 13) % 5) * 0.004,
      phase: index / 7,
      speed: 0.32 + ((index * 7) % 4) * 0.06,
    }
  })
  for (const bubble of bubbles) root.add(bubble.mesh)
  let time = 0
  const place = () => {
    for (const bubble of bubbles) {
      const rise = (time * bubble.speed + bubble.phase) % 1
      const y = -0.42 + rise * (level + 0.42)
      bubble.mesh.position.set(bubble.x, y, bubble.z)
      // Small at the floor, and gone at the top.
      bubble.mesh.scale.setScalar(bubble.size * Math.sin(rise * Math.PI))
    }
  }
  place()
  return {
    root,
    update: ({ delta, hover, motion }) => {
      if (!motion) return
      time += delta * (1 + hover * 1.5)
      place()
    },
  }
}

/** Ruled lines on a page, with a margin in the HUD color. */
function ruledPage(accent: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 360
  const context = canvas.getContext('2d')!
  context.fillStyle = '#5c5650'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#3a3531'
  context.lineWidth = 3
  for (let y = 60; y < canvas.height - 20; y += 28) {
    context.beginPath()
    context.moveTo(18, y)
    context.lineTo(canvas.width - 18, y)
    context.stroke()
  }
  context.strokeStyle = accent
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(52, 20)
  context.lineTo(52, canvas.height - 20)
  context.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Notes: an open notebook with a pen. On hover a page turns. */
function notebook(kit: Kit): Built {
  const root = new THREE.Group()
  // The book lies open, tilted toward the camera.
  const book = new THREE.Group()
  book.rotation.x = 0.95
  root.add(book)
  const cover = kit.graphite(0)
  const cloth = kit.box(1, 0.035, 0.7, cover, 0.015)
  cloth.position.y = -0.03
  book.add(cloth)
  const paper = kit.image(ruledPage(kit.accent), 0.35)
  paper.side = THREE.DoubleSide
  const page = () => {
    const pivot = new THREE.Group()
    const sheet = kit.box(0.46, 0.022, 0.64, paper)
    sheet.position.x = 0.24
    pivot.add(sheet)
    book.add(pivot)
    return pivot
  }
  const left = page()
  left.rotation.z = Math.PI - 0.1
  const right = page()
  right.rotation.z = 0.1
  const turning = page()
  turning.position.y = 0.004
  // The spine, as a line of light.
  book.add(kit.rod(v(0, 0.0, -0.33), v(0, 0.0, 0.33), 0.012, kit.glow()))
  // The pen lies across the right page.
  const pen = new THREE.Group()
  const barrel = kit.graphite(0.3)
  pen.add(kit.rod(v(-0.24, 0, 0), v(0.2, 0, 0), 0.028, barrel))
  const tip = kit.mesh(new THREE.ConeGeometry(0.028, 0.09, 16), kit.glow())
  tip.rotation.z = Math.PI / 2
  tip.position.x = -0.285
  pen.add(tip)
  pen.position.set(0.26, 0.09, 0.02)
  pen.rotation.y = 0.6
  book.add(pen)
  return {
    root,
    update: ({ hover }) => {
      // The page goes over from the right to the left.
      const eased = hover * hover * (3 - 2 * hover)
      turning.rotation.z = 0.12 + eased * (Math.PI - 0.24)
    },
  }
}

/** Performance: a dial. Its needle swings up to the top on hover. */
function dial(kit: Kit): Built {
  const root = new THREE.Group()
  const body = kit.graphite(0.04)
  const rim = kit.graphite(0.32)
  const glow = kit.glow()
  const face = kit.mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.14, 48), body)
  face.rotation.x = Math.PI / 2
  root.add(face)
  const bezel = kit.mesh(new THREE.TorusGeometry(0.47, 0.03, 12, 64), rim)
  bezel.position.z = 0.07
  root.add(bezel)
  // A value from 0 to 1, as an angle: 0 at the lower left, 1 at the lower
  // right, through the top.
  const angleOf = (value: number) => Math.PI * 1.25 - value * Math.PI * 1.5
  const front = 0.072
  const marks = kit.graphite(0.55)
  for (let i = 0; i <= 10; i++) {
    const angle = angleOf(i / 10)
    const major = i % 5 === 0
    const length = major ? 0.08 : 0.05
    const tick = kit.box(0.018, length, 0.012, i >= 8 ? glow : marks)
    const r = 0.37 - length / 2
    tick.position.set(Math.cos(angle) * r, Math.sin(angle) * r, front)
    tick.rotation.z = angle - Math.PI / 2
    root.add(tick)
  }
  // The top of the range, as an arc of light.
  const arc = kit.mesh(
    new THREE.RingGeometry(0.39, 0.415, 40, 1, angleOf(1), Math.PI * 0.45),
    glow,
  )
  arc.position.z = front
  root.add(arc)
  const needle = new THREE.Group()
  const blade = kit.box(0.026, 0.36, 0.014, kit.glow(1.2), 0.006)
  blade.position.y = 0.13
  needle.add(blade)
  needle.position.z = front + 0.012
  root.add(needle)
  const cap = kit.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), rim)
  cap.rotation.x = Math.PI / 2
  cap.position.z = front + 0.02
  root.add(cap)
  let value = 0.55
  return {
    root,
    // On hover the dial turns to the camera, a little to one side.
    faceOnHover: 0.3,
    update: ({ t, delta, hover, motion }) => {
      const idle = motion
        ? 0.55 + Math.sin(t * 1.3) * 0.06 + Math.sin(t * 4.1) * 0.015
        : 0.55
      value = ease(value, idle + (0.94 - idle) * hover, 7, delta)
      // At the top it redlines: the needle shakes against the end, fast
      // and uneven, as an engine at its limit.
      const shake = motion
        ? hover *
          hover *
          (Math.sin(t * 41) * 0.014 +
            Math.sin(t * 67 + 1.3) * 0.01 +
            (Math.random() - 0.5) * 0.012)
        : 0
      needle.rotation.z = angleOf(Math.min(value + shake, 1)) - Math.PI / 2
    },
  }
}

/** Design: a pen nib on a curve, with the handles of the curve. */
function pen(kit: Kit): Built {
  const root = new THREE.Group()
  const body = kit.graphite(0.14)
  const glow = kit.glow()
  // The nib points down to the middle of the curve.
  const tipY = -0.34
  const outline = new THREE.Shape()
  outline.moveTo(0, tipY)
  outline.lineTo(0.22, 0.02)
  outline.quadraticCurveTo(0.24, 0.1, 0.17, 0.2)
  outline.lineTo(-0.17, 0.2)
  outline.quadraticCurveTo(-0.24, 0.1, -0.22, 0.02)
  outline.closePath()
  const eye = new THREE.Path()
  eye.absarc(0, -0.03, 0.045, 0, Math.PI * 2, true)
  outline.holes.push(eye)
  const depth = 0.1
  const nibShape = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  })
  nibShape.translate(0, 0, -depth / 2)
  root.add(kit.mesh(nibShape, body))
  // The slit from the eye to the tip, and the eye, in light.
  const slit = kit.box(0.014, 0.25, 0.012, glow)
  slit.position.set(0, (tipY + 0.02 - 0.075) / 2, depth / 2 + 0.012)
  root.add(slit)
  const eyeGlow = kit.mesh(
    new THREE.CylinderGeometry(0.044, 0.044, depth, 20),
    glow,
  )
  eyeGlow.rotation.x = Math.PI / 2
  eyeGlow.position.y = -0.03
  root.add(eyeGlow)
  const collar = kit.box(0.4, 0.12, 0.15, kit.graphite(0.3), 0.03)
  collar.position.y = 0.26
  root.add(collar)

  // The curve: anchors at the ends, handles to the two control points.
  const anchors = [v(-0.48, -0.16, 0.04), v(0.48, -0.16, 0.04)]
  const rest = [v(-0.2, -0.53, 0.04), v(0.2, -0.53, 0.04)]
  const handles = rest.map((p) => p.clone())
  const knobMaterial = kit.graphite(0.6)
  for (const at of anchors) {
    const anchor = kit.box(0.07, 0.07, 0.07, kit.graphite(0.6))
    anchor.position.copy(at)
    root.add(anchor)
  }
  const knobs = handles.map(() => {
    const knob = kit.mesh(new THREE.SphereGeometry(0.03, 14, 10), knobMaterial)
    root.add(knob)
    return knob
  })
  const lineMaterial = kit.graphite(0.5)
  const lines = handles.map(() => {
    const line = kit.mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 1, 6),
      lineMaterial,
    )
    root.add(line)
    return line
  })
  const curve = new THREE.CubicBezierCurve3(
    anchors[0],
    handles[0],
    handles[1],
    anchors[1],
  )
  const stroke = kit.mesh(new THREE.BufferGeometry(), glow)
  root.add(stroke)
  let shown = -1
  const draw = (hover: number) => {
    // On hover the handles pull down and out, and the curve follows.
    handles[0].set(-0.2 - hover * 0.1, -0.53 - hover * 0.12, 0.04)
    handles[1].set(0.2 + hover * 0.1, -0.53 - hover * 0.12, 0.04)
    handles.forEach((handle, index) => {
      knobs[index].position.copy(handle)
      const anchor = anchors[index]
      const line = lines[index]
      line.position.copy(anchor).add(handle).multiplyScalar(0.5)
      line.scale.y = anchor.distanceTo(handle)
      line.quaternion.setFromUnitVectors(
        v(0, 1, 0),
        handle.clone().sub(anchor).normalize(),
      )
    })
    stroke.geometry.dispose()
    stroke.geometry = kit.geometry(
      new THREE.TubeGeometry(curve, 48, 0.014, 8, false),
    )
    shown = hover
  }
  draw(0)
  root.position.y = 0.08
  return {
    root,
    update: ({ hover }) => {
      if (Math.abs(hover - shown) > 0.004) draw(hover)
    },
  }
}

/** Contact: a paper plane that bobs and banks as it flies. */
function plane(kit: Kit): Built {
  const root = new THREE.Group()
  const craft = new THREE.Group()
  root.add(craft)
  // Folded paper, nose to +x: two wings and a keel under them.
  const nose = v(0.55, 0.02, 0)
  const tail = v(-0.45, 0.02, 0)
  const left = v(-0.47, 0.12, 0.42)
  const right = v(-0.47, 0.12, -0.42)
  const keel = v(-0.45, -0.2, 0)
  const sheet = (faces: Array<Array<THREE.Vector3>>, shade: number) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        faces.flatMap((face) => face.flatMap((p) => p.toArray())),
        3,
      ),
    )
    geometry.computeVertexNormals()
    craft.add(
      kit.mesh(geometry, kit.graphite(shade, { side: THREE.DoubleSide })),
    )
  }
  // Light paper on the wings, a darker keel under them.
  sheet(
    [
      [nose, left, tail],
      [nose, tail, right],
    ],
    0.6,
  )
  sheet([[nose, tail, keel]], 0.15)
  // The folds, in light.
  const glow = kit.glow()
  for (const [a, b] of [
    [nose, tail],
    [nose, left],
    [nose, right],
  ]) {
    craft.add(kit.rod(a, b, 0.009, glow))
  }
  // The plane flies up and to the right, seen from above, so the wings
  // show: a turn in the plane of the wings, then a tip toward the camera.
  root.rotation.set(0.9, 0.5, 0, 'XYZ')
  return {
    root,
    update: ({ t, hover, motion }) => {
      const sway = motion ? 1 : 0
      craft.position.y = Math.sin(t * 1.6) * 0.05 * sway + hover * 0.06
      craft.position.x = hover * 0.08
      craft.rotation.x = Math.sin(t * 1.1) * 0.16 * sway
      craft.rotation.z = Math.sin(t * 1.6 + 1) * 0.06 * sway + hover * 0.14
    },
  }
}

/** Privacy: a padlock. On hover its shackle lifts and swings open. */
function padlock(kit: Kit): Built {
  const root = new THREE.Group()
  const body = kit.graphite(0.08)
  const steel = kit.graphite(0.45, { roughness: 0.38, metalness: 0.35 })
  const glow = kit.glow()
  const lock = kit.box(0.66, 0.5, 0.26, body, 0.06)
  lock.position.y = -0.2
  root.add(lock)
  // The shackle turns about its left leg.
  const swing = new THREE.Group()
  swing.position.x = -0.19
  const shackle = new THREE.Group()
  shackle.position.x = 0.19
  const bow = kit.mesh(
    new THREE.TorusGeometry(0.19, 0.045, 12, 32, Math.PI),
    steel,
  )
  bow.position.y = 0.2
  shackle.add(bow)
  for (const x of [-0.19, 0.19]) {
    shackle.add(kit.rod(v(x, 0.2), v(x, -0.02), 0.045, steel))
  }
  swing.add(shackle)
  root.add(swing)
  // The keyhole, in light.
  const hole = kit.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24), glow)
  hole.rotation.x = Math.PI / 2
  hole.position.set(0, -0.15, 0.131)
  root.add(hole)
  const slot = kit.box(0.036, 0.12, 0.02, glow)
  slot.position.set(0, -0.23, 0.131)
  root.add(slot)
  // A band of light across the body.
  const band = kit.box(0.672, 0.016, 0.272, glow, 0.006)
  band.position.y = -0.36
  root.add(band)
  root.position.y = 0.06
  return {
    root,
    update: ({ hover }) => {
      swing.position.y = hover * 0.14
      swing.rotation.y = hover * 0.75
    },
  }
}
