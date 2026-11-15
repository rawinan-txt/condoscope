/** True when this browser can create a WebGL2 context (the 3D views need it). */
export function hasWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
