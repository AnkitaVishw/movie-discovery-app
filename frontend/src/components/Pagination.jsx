export default function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav className="pagination" aria-label="Results pages">
      <button type="button" disabled={!canPrev} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button type="button" disabled={!canNext} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
