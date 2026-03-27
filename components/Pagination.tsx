import Link from "next/link";

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  /** Base path for href-based navigation, e.g. "/radar" or "/crosshairs" */
  basePath: string;
}

/**
 * Renders "Showing X–Y of Z" text and Prev / Next links.
 * Returns null when all results fit on a single page.
 */
export default function Pagination({ total, limit, offset, basePath }: PaginationProps) {
  if (total <= limit) return null;

  const start = offset + 1;
  const end = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;
  const prevOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit;

  const mono = { fontFamily: "var(--font-geist-mono)" };

  return (
    <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
      <p
        className="text-xs tabular-nums"
        style={{ ...mono, color: "var(--text-muted)" }}
      >
        Showing {start}–{end} of {total}
      </p>

      <div className="flex gap-4">
        {hasPrev ? (
          <Link
            href={`${basePath}?offset=${prevOffset}`}
            className="read-link text-xs"
          >
            ← PREV
          </Link>
        ) : (
          <span
            className="text-xs"
            style={{ ...mono, color: "var(--text-muted)", opacity: 0.3 }}
          >
            ← PREV
          </span>
        )}

        {hasNext ? (
          <Link
            href={`${basePath}?offset=${nextOffset}`}
            className="read-link text-xs"
          >
            NEXT →
          </Link>
        ) : (
          <span
            className="text-xs"
            style={{ ...mono, color: "var(--text-muted)", opacity: 0.3 }}
          >
            NEXT →
          </span>
        )}
      </div>
    </div>
  );
}
