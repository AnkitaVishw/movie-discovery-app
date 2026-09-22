import MovieCard from "./MovieCard";

export function MovieGrid({ movies }) {
  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}

export function MovieGridSkeleton() {
  return (
    <div className="movie-grid" aria-busy="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton poster-sk" />
          <div className="skeleton line" />
          <div className="skeleton line short" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="state-card">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-card error">
      <h2>Couldn’t load movies</h2>
      <p>{message || "Something went wrong. Please try again."}</p>
      {onRetry ? (
        <button type="button" className="primary-btn" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
