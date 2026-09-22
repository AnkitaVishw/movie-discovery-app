const COLLECTIONS = [
  { value: "popular", label: "Popular" },
  { value: "trending", label: "Trending" },
  { value: "now_playing", label: "Now playing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "top_rated", label: "Top rated" },
];

const SORTS = [
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A–Z" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

export default function Filters({ values, genres, onChange, onSearchChange }) {
  return (
    <section className="filters">
      <label className="search-field">
        <span className="sr-only">Search movies</span>
        <input
          type="search"
          placeholder="Search titles…"
          value={values.query}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <label>
        Browse
        <select
          value={values.collection}
          onChange={(e) => onChange({ collection: e.target.value, page: 1 })}
          disabled={Boolean(values.query)}
        >
          {COLLECTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Genre
        <select
          value={values.genre}
          onChange={(e) => onChange({ genre: e.target.value, page: 1 })}
        >
          <option value="">All genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Year
        <select value={values.year} onChange={(e) => onChange({ year: e.target.value, page: 1 })}>
          <option value="">Any year</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sort
        <select value={values.sort} onChange={(e) => onChange({ sort: e.target.value, page: 1 })}>
          {SORTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
