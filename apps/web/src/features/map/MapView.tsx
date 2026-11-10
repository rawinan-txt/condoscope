import { formatMillion, type Project } from '@condoscope/shared';
import { Map as MapLibreMap, Marker, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef } from 'react';
import { boundsOf, THAILAND_VIEW } from './geo';

// OpenFreeMap quick start for Vite + MapLibre 6: tell MapLibre where its worker file is
setWorkerUrl(workerUrl);
const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text; // textContent only: project data never becomes HTML
  if (className) node.className = className;
  return node;
}

function popupContent(p: Project): HTMLElement {
  const box = el('div', undefined, 'space-y-1 text-sm');
  box.append(el('strong', p.name), el('p', `${p.neighborhood} · ${p.province}`), el('p', `เริ่มต้น ${formatMillion(p.starting_price)}`));
  const link = el('a', 'ดูโครงการ', 'font-medium text-accent underline');
  link.href = `#/project/${p.id}`;
  box.append(link);
  return box;
}

/** The map with one keyboard-operable button marker per project. Lazy-loaded; tells the page when it cannot be used. */
export default function MapView({ projects, onUnavailable }: { projects: Project[]; onUnavailable(reason: 'style' | 'webgl'): void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({ container: box.current!, style: STYLE, center: THAILAND_VIEW.center, zoom: THAILAND_VIEW.zoom });
    } catch {
      onUnavailable('webgl'); // no WebGL / context could not be created
      return;
    }
    let loaded = false;
    map.on('load', () => { loaded = true; });
    // single tile errors after the style loaded are ignored: the map still works; a style that never loads is "unavailable"
    map.on('error', () => { if (!loaded) onUnavailable('style'); });

    const markers = projects.map((p) => {
      const button = el('button', undefined, 'size-6 cursor-pointer rounded-full border-2 border-white bg-accent shadow-md');
      button.type = 'button';
      button.setAttribute('aria-label', `โครงการ ${p.name}`);
      return new Marker({ element: button }).setLngLat([p.longitude, p.latitude]).setPopup(new Popup({ offset: 16 }).setDOMContent(popupContent(p))).addTo(map);
    });
    const bounds = boundsOf(projects);
    if (bounds) map.fitBounds(bounds, { padding: 40, duration: 0, maxZoom: 14 });

    return () => {
      markers.forEach((m) => m.remove());
      map.remove(); // also runs on the extra mount/unmount of React StrictMode
    };
  }, [projects, onUnavailable]);

  return <div ref={box} className="h-[60vh] min-h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100" role="region" aria-label="แผนที่โครงการ" />;
}
