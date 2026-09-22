import { Link, useLocation } from "react-router-dom";
import Poster from "./Poster";
import { useWishlist } from "../wishlist";

export default function MovieCard({ movie }) {
  const location = useLocation();
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(movie.id);

  return (
    <article className="movie-card">
      <Link
        to={`/movie/${movie.id}`}
        state={{ from: location.pathname + location.search }}
        className="card-link"
      >
        <Poster src={movie.posterUrl} alt={`${movie.title} poster`} />
        <div className="card-meta">
          <h3 title={movie.title}>{movie.title}</h3>
          <p>
            <span>{movie.year || "—"}</span>
            <span className="rating">★ {movie.rating || "N/A"}</span>
          </p>
        </div>
      </Link>
      <button
        type="button"
        className={`wish-btn ${saved ? "saved" : ""}`}
        onClick={() => toggle(movie)}
        aria-pressed={saved}
      >
        {saved ? "Saved" : "Save"}
      </button>
    </article>
  );
}
