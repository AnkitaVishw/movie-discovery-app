export async function request(path, options = {}) {
  const { signal, ...rest } = options;
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(rest.headers || {}) },
    signal,
    ...rest,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = new Error(body?.error || "Request failed");
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body;
}

export function fetchMovies(params, signal) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return request(`/api/movies?${query.toString()}`, { signal });
}

export function fetchMovie(id, signal) {
  return request(`/api/movies/${id}`, { signal });
}

export function fetchGenres(signal) {
  return request("/api/movies/genres", { signal }).then((data) => data.genres);
}

export const wishlistApi = {
  list: (signal) => request("/api/wishlist", { signal }),
  ids: (signal) => request("/api/wishlist/ids", { signal }),
  add: (movie) =>
    request("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        releaseDate: movie.releaseDate,
        rating: movie.rating,
        overview: movie.overview,
      }),
    }),
  remove: (id) => request(`/api/wishlist/${id}`, { method: "DELETE" }),
};
