import { Link } from 'react-router';

export default function NotFound({ message = 'ไม่พบหน้าที่คุณต้องการ' }: { message?: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">ไม่พบข้อมูล</h1>
      <p className="mt-2 text-stone">{message}</p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-hover">กลับหน้าแรก</Link>
    </div>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="mt-2 text-stone">ลองใหม่อีกครั้ง หรือกลับไปหน้าแรก</p>
      <button type="button" onClick={onRetry} className="mt-6 rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-hover">ลองใหม่</button>
    </div>
  );
}
