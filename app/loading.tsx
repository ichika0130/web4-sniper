export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span
        className="cursor-blink text-sm font-bold tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-geist-mono)", color: "var(--primary)" }}
      >
        SCANNING...
      </span>
    </div>
  );
}
