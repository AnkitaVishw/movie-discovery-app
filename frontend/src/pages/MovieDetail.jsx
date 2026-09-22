import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchMovie } from "../api";
import Poster from "../components/Poster";
import MovieCard from "../components/MovieCard";
import { EmptyState, ErrorState, MovieGridSkeleton } from "../components/MovieGrid";
import { useWishlist } from "../wishlist";

export default function MovieDetail() {
  const { id } = useParams();
  const location = useLocation();
  const backTo = location.state?.from || "/";
  const { isSaved, toggle } = useWishlist();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchMovie(id, controller.signal)
      .then(setMovie)
      .catch((err) => {
        if (err.name === "AbortError") return;
        setMovie(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading) return <MovieGridSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!movie) return <EmptyState title="Movie not found" body="It may have been removed from the catalog." />;

  const saved = isSaved(movie.id);

  return (
    <article className="detail">
      <Link to={backTo} className="back-link">
        ← Back
      </Link>
      <div className="detail-hero">
        <Poster src={movie.posterUrl} alt={`${movie.title} poster`} className="detail-poster" />
        <div>
          <p className="eyebrow">{movie.year || "Unknown year"}</p>
          <h1>{movie.title}</h1>
          {movie.tagline ? <p className="tagline">{movie.tagline}</p> : null}
          <p className="detail-facts">
            <span>★ {movie.rating || "N/A"}</span>
            {movie.runtime ? <span>{movie.runtime} min</span> : null}
            {movie.genres?.length ? <span>{movie.genres.join(" · ")}</span> : null}
          </p>
          <p className="overview">{movie.overview || "No synopsis is available for this title."}</p>
          <button type="button" className={`primary-btn ${saved ? "saved" : ""}`} onClick={() => toggle(movie)}>
            {saved ? "Remove from wishlist" : "Add to wishlist"}
          </button>
        </div>
      </div>

      {movie.cast?.length ? (
        <section>
          <h2>Cast</h2>
          <ul className="cast-list">
            {movie.cast.map((person) => (
              <li key={person.id}>
                <Poster src={person.photoUrl} alt="" />
                <strong>{person.name}</strong>
                <span>{person.character}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {movie.similar?.length ? (
        <section>
          <h2>More like this</h2>
          <div className="movie-grid compact">
            {movie.similar.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
