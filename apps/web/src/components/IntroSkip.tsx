import { useFinishIntro } from '../lib/intro';

/** Always visible while the intro plays, and the first thing the Tab key reaches (the layout puts it before the menu). */
export default function IntroSkip() {
  const finish = useFinishIntro();
  return (
    <button type="button" onClick={finish} className="fixed right-4 top-16 z-50 bg-ivory px-5 py-2 font-medium text-ink shadow-lg hover:bg-champagne-soft">
      ข้าม<span className="sr-only">การแนะนำ</span>
    </button>
  );
}
