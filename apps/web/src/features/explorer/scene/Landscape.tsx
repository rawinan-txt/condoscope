import { mulberry32 } from '@condoscope/shared';
import { memo, useMemo } from 'react';
import {
  BoxGeometry, Color, ConeGeometry, CylinderGeometry, IcosahedronGeometry, InstancedMesh, Matrix4, MeshBasicMaterial,
  MeshStandardMaterial, Quaternion, SphereGeometry, Vector3,
} from 'three';
import type { Bounds } from './layout';
import type { TimeOfDay } from './time';

const Q = new Quaternion();
const mat = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => new Matrix4().compose(new Vector3(x, y, z), Q, new Vector3(sx, sy, sz));

const ROUND = new IcosahedronGeometry(1.8, 1);
const CONE = new ConeGeometry(1.4, 4.2, 8);
const TALL = new SphereGeometry(1, 10, 8);
const TRUNK = new CylinderGeometry(0.15, 0.2, 1, 6);
const DISC = new CylinderGeometry(0.25, 0.25, 0.08, 10);
const BOX = new BoxGeometry(1, 1, 1);
const POLE = new CylinderGeometry(0.05, 0.05, 2.2, 6);
const SHADE = new ConeGeometry(1.4, 0.6, 10);

const leafA = new MeshStandardMaterial({ color: 0x2a4a2c, roughness: 0.95 });
const leafB = new MeshStandardMaterial({ color: 0x3b5f2f, roughness: 0.95 });
const leafC = new MeshStandardMaterial({ color: 0x24402f, roughness: 0.95 });
const trunk = new MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 });
const lounger = new MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.7 });
const shade = new MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.8 });
const uplightDusk = new MeshBasicMaterial({ color: new Color(3.5, 2.6, 1.4) });
const uplightDay = new MeshBasicMaterial({ color: new Color(0.6, 0.6, 0.55) });

function fill(list: Matrix4[]) {
  return (m: InstancedMesh | null) => {
    if (!m) return;
    list.forEach((t, i) => m.setMatrixAt(i, t));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  };
}

/** Roof garden on the podium: three tree shapes with uplights, and loungers + umbrellas beside the pool. */
export default memo(function Landscape({ r, seed, time }: { r: Bounds; seed: number; time: TimeOfDay }) {
  const H = r.podiumH;
  const cx = (r.minX + r.maxX) / 2;
  const w = r.maxX - r.minX;
  const poolW = Math.min(25, w * 0.4);
  const poolZ = r.maxZ - 6.5;

  const t = useMemo(() => {
    const rng = mulberry32(seed + 17);
    const round: Matrix4[] = [], cone: Matrix4[] = [], tall: Matrix4[] = [], trunks: Matrix4[] = [], lights: Matrix4[] = [];
    const count = Math.round(w / 1.4);
    for (let i = 0; i < count; i++) {
      const x = r.minX + 2 + rng() * (w - 4);
      // south edge strip, leaving the pool deck clear
      const z = r.maxZ - 1.2 - rng() * 2.5;
      if (Math.abs(x - cx) < Math.min(32, w * 0.5) / 2 + 1 && rng() < 0.85) continue;
      const s = 0.75 + rng() * 0.7;
      const kind = rng();
      trunks.push(mat(x, H + 0.3 + 0.6 * s, z, s, 1.2 * s, s));
      lights.push(mat(x + 0.6, H + 0.34, z + 0.4, 1, 1, 1));
      if (kind < 0.45) round.push(mat(x, H + 0.3 + 2.4 * s, z, s, s * 1.1, s));
      else if (kind < 0.75) cone.push(mat(x, H + 0.3 + 2.8 * s, z, s, s, s));
      else tall.push(mat(x, H + 0.3 + 3 * s, z, 0.9 * s, 2.2 * s, 0.9 * s));
    }
    const loungers: Matrix4[] = [], poles: Matrix4[] = [], shades: Matrix4[] = [];
    const n = Math.max(3, Math.floor(poolW / 4));
    for (let i = 0; i < n; i++) {
      const x = cx - poolW / 2 + 2 + (i * (poolW - 4)) / Math.max(1, n - 1);
      loungers.push(mat(x - 0.6, H + 0.55, poolZ - 3.6, 0.7, 0.35, 1.9));
      loungers.push(mat(x + 0.6, H + 0.55, poolZ - 3.6, 0.7, 0.35, 1.9));
      if (i % 2 === 0) { poles.push(mat(x, H + 1.45, poolZ - 3.9, 1, 1, 1)); shades.push(mat(x, H + 2.6, poolZ - 3.9, 1, 1, 1)); }
    }
    return { round, cone, tall, trunks, lights, loungers, poles, shades };
  }, [r, seed, w, cx, H, poolW, poolZ]);

  return (
    <group>
      <instancedMesh args={[TRUNK, trunk, t.trunks.length]} ref={fill(t.trunks)} />
      <instancedMesh args={[ROUND, leafA, t.round.length]} ref={fill(t.round)} castShadow />
      <instancedMesh args={[CONE, leafB, t.cone.length]} ref={fill(t.cone)} castShadow />
      <instancedMesh args={[TALL, leafC, t.tall.length]} ref={fill(t.tall)} castShadow />
      <instancedMesh args={[DISC, time === 'dusk' ? uplightDusk : uplightDay, t.lights.length]} ref={fill(t.lights)} />
      <instancedMesh args={[BOX, lounger, t.loungers.length]} ref={fill(t.loungers)} castShadow />
      <instancedMesh args={[POLE, trunk, t.poles.length]} ref={fill(t.poles)} />
      <instancedMesh args={[SHADE, shade, t.shades.length]} ref={fill(t.shades)} castShadow />
    </group>
  );
});
