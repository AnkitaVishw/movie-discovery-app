import { useEffect, useMemo, useState } from "react";
import { wishlistApi } from "../api";
import { EmptyState, ErrorState, MovieGrid, MovieGridSkeleton } from "../components/MovieGrid";
import { useWishlist } from "../wishlist";

export default function Wishlist() {
  const { ids } = useWishlist();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const visible = useMemo(() => movies.filter((movie) => ids.has(movie.id)), [movies, ids]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    wishlistApi
      .list(controller.signal)
      .then((data) => setMovies(data.movies || []))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h1>Your wishlist</h1>
          <p className="lede">These titles stay here after you close the tab — they are stored in the app database.</p>
        </div>
      </div>
      {loading ? <MovieGridSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && visible.length === 0 ? (
        <EmptyState title="Wishlist is empty" body="Save a movie from Discover and it will show up here." />
      ) : null}
      {!loading && !error && visible.length > 0 ? <MovieGrid movies={visible} /> : null}
    </div>
  );
}
