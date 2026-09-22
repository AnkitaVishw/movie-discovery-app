import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchGenres, fetchMovies } from "../api";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import { EmptyState, ErrorState, MovieGrid, MovieGridSkeleton } from "../components/MovieGrid";

const DEFAULTS = {
  query: "",
  collection: "popular",
  genre: "",
  year: "",
  sort: "popularity",
  page: "1",
};

function readParams(searchParams) {
  return {
    query: searchParams.get("query") || DEFAULTS.query,
    collection: searchParams.get("collection") || DEFAULTS.collection,
    genre: searchParams.get("genre") || DEFAULTS.genre,
    year: searchParams.get("year") || DEFAULTS.year,
    sort: searchParams.get("sort") || DEFAULTS.sort,
    page: searchParams.get("page") || DEFAULTS.page,
  };
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readParams(searchParams), [searchParams]);
  const [queryInput, setQueryInput] = useState(filters.query);
  const [genres, setGenres] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGenres(controller.signal).then(setGenres).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (queryInput === filters.query) return;
      updateParams({ query: queryInput, page: 1 });
    }, 400);
    return () => clearTimeout(handle);
  }, [queryInput]);

  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    fetchMovies(
      {
        query: filters.query,
        collection: filters.collection,
        genre: filters.genre,
        year: filters.year,
        sort: filters.sort,
        page: filters.page,
      },
      controller.signal
    )
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (id !== requestId.current) return;
        setData(null);
        setError(err.message);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    return () => controller.abort();
  }, [filters.query, filters.collection, filters.genre, filters.year, filters.sort, filters.page, reloadToken]);

  function updateParams(patch) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== DEFAULTS[key]) params.set(key, value);
    });
    setSearchParams(params, { replace: Boolean(patch.query !== undefined) });
  }

  const heading = filters.query
    ? `Results for “${filters.query}”`
    : "Discover something to watch";

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Movie discovery</p>
          <h1>{heading}</h1>
          <p className="lede">
            Browse a free public catalog, filter by genre or year, or search when you already have a title in mind.
          </p>
        </div>
      </div>

      <Filters
        values={{ ...filters, query: queryInput }}
        genres={genres}
        onChange={updateParams}
        onSearchChange={setQueryInput}
      />

      {loading ? <MovieGridSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => setReloadToken((n) => n + 1)} /> : null}
      {!loading && !error && data?.movies?.length === 0 ? (
        <EmptyState
          title="No movies matched"
          body="Try a different title, genre, or year. Clearing filters is often enough."
        />
      ) : null}
      {!loading && !error && data?.movies?.length ? (
        <>
          <p className="result-count">
            {data.totalResults.toLocaleString()} titles
          </p>
          <MovieGrid movies={data.movies} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPage={(page) => updateParams({ page })}
          />
        </>
      ) : null}
    </div>
  );
}
