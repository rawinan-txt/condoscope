import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="bg-ink px-4 py-8 text-center text-xs leading-relaxed text-ink-muted">
      <p className="font-serif text-base text-ivory">CondoScope</p>
      <p className="mt-2"><Link to="/intro" className="underline underline-offset-4 hover:text-ivory">ดูแนะนำอีกครั้ง</Link></p>
      <p className="mt-2">ข้อมูลจำลองเพื่อการสาธิต ไม่มีการขายจริง · ชื่อโครงการทั้งหมดเป็นชื่อสมมติ · ภาพภายในห้องเป็นภาพประกอบสร้างด้วย AI</p>
    </footer>
  );
}
