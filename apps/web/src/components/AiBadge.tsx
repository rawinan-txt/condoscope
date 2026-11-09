/** Corner label for AI-generated images (spec section 5: "ภาพประกอบสร้างด้วย AI"). Plain text so screen readers read it too. */
export default function AiBadge() {
  return (
    <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-slate-900/75 px-2 py-0.5 text-xs text-white">
      ภาพประกอบสร้างด้วย AI
    </span>
  );
}
