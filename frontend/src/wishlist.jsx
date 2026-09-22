import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { wishlistApi } from "./api";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    wishlistApi
      .ids(controller.signal)
      .then((data) => setIds(new Set(data.ids)))
      .catch(() => {})
      .finally(() => setReady(true));
    return () => controller.abort();
  }, []);

  const isSaved = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(async (movie) => {
    if (!movie?.id) return;
    const currentlySaved = ids.has(movie.id);
    setIds((prev) => {
      const next = new Set(prev);
      if (currentlySaved) next.delete(movie.id);
      else next.add(movie.id);
      return next;
    });
    try {
      if (currentlySaved) await wishlistApi.remove(movie.id);
      else await wishlistApi.add(movie);
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.add(movie.id);
        else next.delete(movie.id);
        return next;
      });
    }
  }, [ids]);

  const value = useMemo(() => ({ ids, ready, isSaved, toggle }), [ids, ready, isSaved, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
