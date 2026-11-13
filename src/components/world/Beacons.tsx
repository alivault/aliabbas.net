import { useMemo } from 'react'
import * as THREE from 'three'
import { SHEETS } from './sheets'
import { WORLD_UNIFORMS } from './sky'

/** How high a beacon rises over its icon, in meters. */
const HEIGHT = 70

/**
 * A thin column of light over each icon. The fog hides an icon some 60 m
 * away; its beacon shows through the fog, so a visitor who walked far can
 * see where the pages are. A beacon shows only from a distance: near its
 * icon, the icon is the mark. It fades out while a page is open.
 */
export default function Beacons({ color }: { color: string }) {
  const geometry = useMemo(() => {
    // A unit plane from y 0 to 1, turned to the camera in the shader.
    const plane = new THREE.PlaneGeometry(1, 1)
    plane.translate(0, 0.5, 0)
    return plane
  }, [])

  const beacons = useMemo(
    () =>
      SHEETS.map((sheet) => {
        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            // From the center of the icon: the icon hides the part inside
            // it, so the light leaves its top with no gap, also as the
            // icon bobs.
            uBase: { value: new THREE.Vector3(sheet.x, sheet.y, sheet.z) },
            uColor: { value: new THREE.Color(color) },
            uDim: WORLD_UNIFORMS.uDim,
          },
          vertexShader: /* glsl */ `
            uniform vec3 uBase;
            varying vec2 vUv;
            varying float vDistance;
            void main() {
              vUv = uv;
              vec3 toCamera = cameraPosition - uBase;
              float distance = length(toCamera.xz);
              // Turned to the camera around the vertical, and wider far
              // away, so it keeps about the same width on screen.
              vec3 right = normalize(vec3(toCamera.z, 0.0, -toCamera.x) + 1e-5);
              float width = 0.3 + distance * 0.012;
              vec3 world = uBase + right * position.x * width
                + vec3(0.0, position.y * ${HEIGHT.toFixed(1)}, 0.0);
              vDistance = distance;
              gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uDim;
            varying vec2 vUv;
            varying float vDistance;
            void main() {
              // A soft core across, and a fade to nothing toward the top.
              float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
              float core = across * across;
              float rise = pow(1.0 - vUv.y, 1.6);
              // Only from a distance: none within 18 m, full past 45 m.
              float far = smoothstep(18.0, 45.0, vDistance);
              float alpha = core * rise * far * 0.55 * (1.0 - uDim);
              gl_FragColor = vec4(uColor * alpha, alpha);
            }
          `,
        })
        return { id: sheet.id, material }
      }),
    [color],
  )

  return (
    <>
      {beacons.map(({ id, material }) => (
        <mesh
          key={id}
          geometry={geometry}
          material={material}
          // The shader places it; the box of the plane is not where it draws.
          frustumCulled={false}
          renderOrder={2}
          raycast={() => null}
        />
      ))}
    </>
  )
}
