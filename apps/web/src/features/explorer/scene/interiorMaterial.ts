import { MeshStandardMaterial } from 'three';
import { uNight } from './time';

/**
 * Unit glass with interior mapping: the view ray is traced inside the unit box, so each window shows
 * a room with depth (floor, ceiling, walls, curtains, a ceiling lamp), varied per instance by aSeed.
 * Per-instance attributes: aEmit (status/highlight colour), aLit (0..1 lights on), aSeed (0..1).
 */
export function interiorGlassMaterial() {
  const m = new MeshStandardMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.12, envMapIntensity: 0.8 });
  m.customProgramCacheKey = () => 'interior-glass';
  m.onBeforeCompile = (s) => {
    s.uniforms.uNight = uNight;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aEmit; attribute float aLit; attribute float aSeed;
        varying vec3 vEmit; varying float vLit; varying float vSeed; varying vec3 vLocalPos; varying vec3 vLocalCam;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vEmit = aEmit; vLit = aLit; vSeed = aSeed; vLocalPos = position;
        vLocalCam = (inverse(modelMatrix * instanceMatrix) * vec4(cameraPosition, 1.0)).xyz;`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uNight;
        varying vec3 vEmit; varying float vLit; varying float vSeed; varying vec3 vLocalPos; varying vec3 vLocalCam;
        vec3 roomCol; float roomRnd;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 rd = normalize(vLocalPos - vLocalCam);
          vec3 tb = (sign(rd) * 0.5 - vLocalPos) / rd;
          float tm = min(min(tb.x, tb.y), tb.z);
          vec3 h = vLocalPos + rd * tm;
          roomRnd = fract(sin(vSeed * 91.7 + 3.1) * 43758.5453);
          vec3 wall = mix(vec3(0.86, 0.80, 0.71), vec3(0.74, 0.79, 0.84), step(0.55, roomRnd));
          if (tm == tb.y) {
            roomCol = rd.y > 0.0
              ? vec3(0.93) + vec3(1.2, 1.0, 0.7) * smoothstep(0.22, 0.0, length(h.xz)) // ceiling + lamp
              : mix(vec3(0.42, 0.30, 0.2), vec3(0.6, 0.58, 0.55), step(0.7, roomRnd));  // wood or tile floor
          } else {
            roomCol = (tm == tb.z ? wall : wall * 0.78) * (0.75 + 0.35 * (h.y + 0.5));
          }
          roomCol *= 1.0 - 0.3 * clamp(tm, 0.0, 1.5);
          // curtains drawn in from both sides, a different amount per room
          float c = 0.12 + 0.3 * fract(roomRnd * 7.31);
          float curtain = step(0.5 - c * 0.5, abs(vLocalPos.x));
          roomCol = mix(roomCol, vec3(0.93, 0.88, 0.78), curtain * 0.85);
          diffuseColor.rgb = mix(diffuseColor.rgb, roomCol * 0.55, 0.5 * (1.0 - uNight));
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 warm = mix(vec3(1.0, 0.72, 0.45), vec3(0.85, 0.9, 1.0), step(0.86, roomRnd));
        totalEmissiveRadiance += roomCol * warm * vLit * (0.06 + 0.94 * uNight) * 1.15 + vEmit;`);
  };
  return m;
}
