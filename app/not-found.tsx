export default function NotFound() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center"
    >
      <p
        className="text-xs font-semibold tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
      >
        ▶ SIGNAL LOST
      </p>

      <h1
        className="glow-green font-bold leading-none"
        style={{
          fontFamily: "var(--font-geist-mono)",
          color:      "var(--primary)",
          fontSize:   "clamp(5rem, 20vw, 10rem)",
        }}
      >
        404
      </h1>

      <p
        className="text-base"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}
      >
        Target not found. It may have rugged.
      </p>

      <a
        href="/"
        className="read-link mt-4"
        style={{ fontSize: "0.75rem" }}
      >
        ← RETURN TO BASE
      </a>
    </div>
  );
}
