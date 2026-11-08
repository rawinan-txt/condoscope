import { mulberry32 } from '@condoscope/shared';
import { useMemo } from 'react';
import { BoxGeometry, IcosahedronGeometry, Matrix4, MeshBasicMaterial, MeshStandardMaterial, Color, Quaternion, Vector3 } from 'three';
import type { Bounds } from './layout';

const BOX = new BoxGeometry(1, 1, 1);
const Q = new Quaternion();
const mat = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => new Matrix4().compose(new Vector3(x, y, z), Q, new Vector3(sx, sy, sz));

const podiumMat = new MeshStandardMaterial({ color: 0x6b6f75, roughness: 0.8 });
const finMat = new MeshStandardMaterial({ color: 0xd8d3ca, roughness: 0.7 });
const lawnMat = new MeshStandardMaterial({ color: 0x35553a, roughness: 0.95 });
const deckMat = new MeshStandardMaterial({ color: 0xcfc7b8, roughness: 0.8 });
const poolMat = new MeshStandardMaterial({ color: 0x4cc3df, roughness: 0.05, metalness: 0.1, emissive: 0x2bb6e6, emissiveIntensity: 0.9 });
const lobbyMat = new MeshStandardMaterial({ color: 0x223040, metalness: 0.6, roughness: 0.2, emissive: 0xffd29a, emissiveIntensity: 1.2 });
const bandMat = new MeshBasicMaterial({ color: new Color(1.6, 1.15, 0.7) });
const treeMat = new MeshStandardMaterial({ color: 0x2a4a2c, roughness: 0.95 });
const groundMat = new MeshStandardMaterial({ color: 0x2a2e33, roughness: 1 });
const plazaMat = new MeshStandardMaterial({ color: 0x9c978d, roughness: 0.9 });
const TREE = new IcosahedronGeometry(1.8, 1);

/** Podium with roof garden + pool, plaza, ground and trees, sized from the project bounds. */
export default function Site({ r, seed }: { r: Bounds; seed: number }) {
  const cx = (r.minX + r.maxX) / 2;
  const cz = (r.minZ + r.maxZ) / 2;
  const w = r.maxX - r.minX;
  const d = r.maxZ - r.minZ;
  const H = r.podiumH;
  const floors = Math.round(H / 3.6);

  const trees = useMemo(() => {
    const rng = mulberry32(seed);
    const list: Matrix4[] = [];
    // roof garden along the south edge (towers sit behind it)
    for (let i = 0; i < Math.round(w / 1.6); i++) {
      const s = 0.8 + rng() * 0.8;
      list.push(mat(r.minX + 2 + rng() * (w - 4), H + 0.3 + 1.6 * s + 1.2, r.maxZ - 1.5 - rng() * 3, s, s * 1.15, s));
    }
    // street trees around the plaza
    for (let x = r.minX - 10; x <= r.maxX + 10; x += 6) list.push(mat(x, 0.2 + 3, r.maxZ + 13 + rng() * 2, 1.3, 1.5, 1.3));
    for (let z = r.minZ - 6; z <= r.maxZ + 8; z += 6) {
      list.push(mat(r.minX - 9 - rng() * 2, 3.2, z, 1.3, 1.5, 1.3));
      list.push(mat(r.maxX + 9 + rng() * 2, 3.2, z, 1.3, 1.5, 1.3));
    }
    return list;
  }, [r, w, H, seed]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={groundMat}><planeGeometry args={[6000, 6000]} /></mesh>
      <mesh geometry={BOX} material={plazaMat} position={[cx, 0.1, cz + 2]} scale={[w + 26, 0.2, d + 30]} receiveShadow />
      <mesh geometry={BOX} material={podiumMat} position={[cx, H / 2, cz]} scale={[w, H, d]} castShadow receiveShadow />
      {Array.from({ length: floors }, (_, i) => (i + 1) * 3.6).map((y, i) => (
        <group key={y}>
          <mesh geometry={BOX} material={finMat} position={[cx, y - 0.2, r.maxZ + 0.2]} scale={[w + 0.6, 0.35, 0.9]} />
          <mesh geometry={BOX} material={finMat} position={[r.maxX + 0.2, y - 0.2, cz]} scale={[0.9, 0.35, d + 0.6]} />
          <mesh geometry={BOX} material={finMat} position={[r.minX - 0.2, y - 0.2, cz]} scale={[0.9, 0.35, d + 0.6]} />
          {i > 0 && <mesh geometry={BOX} material={bandMat} position={[cx, y - 2, r.maxZ + 0.02]} scale={[w - 2, 0.25, 0.1]} />}
        </group>
      ))}
      <mesh geometry={BOX} material={lobbyMat} position={[cx, 1.8, r.maxZ + 0.1]} scale={[Math.min(28, w * 0.4), 3.2, 0.4]} />
      <mesh geometry={BOX} material={lawnMat} position={[cx, H + 0.15, cz]} scale={[w - 1, 0.3, d - 1]} receiveShadow />
      <mesh geometry={BOX} material={deckMat} position={[cx, H + 0.17, r.maxZ - 6.5]} scale={[Math.min(32, w * 0.5), 0.34, 9]} receiveShadow />
      <mesh geometry={BOX} material={poolMat} position={[cx, H + 0.19, r.maxZ - 6.5]} scale={[Math.min(25, w * 0.4), 0.36, 5.5]} />
      <instancedMesh
        args={[TREE, treeMat, trees.length]}
        castShadow
        ref={(m) => { if (m) { trees.forEach((t, i) => m.setMatrixAt(i, t)); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); } }}
      />
    </group>
  );
}
