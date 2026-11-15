import { useEffect, useState } from 'react';
import { skipToSearch } from '../lib/skipToSearch';

/** Visible for as long as the story is on screen, and the first thing the Tab key reaches (the layout puts it before the menu). */
export default function IntroSkip() {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const update = () => {
      const intro = document.querySelector<HTMLElement>('[data-intro]');
      setShown(!intro || !intro.offsetHeight || window.scrollY < intro.offsetTop + intro.offsetHeight - window.innerHeight / 2);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  if (!shown) return null;
  return (
    <button type="button" onClick={skipToSearch} className="fixed right-4 top-16 z-50 bg-ivory px-5 py-2 font-medium text-ink shadow-lg hover:bg-champagne-soft">
      ข้ามไปค้นหา
    </button>
  );
}
