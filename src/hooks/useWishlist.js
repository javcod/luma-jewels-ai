import { useCallback, useEffect, useState } from "react";

// Minimal, real wishlist: React state persisted to localStorage. No backend,
// no auth, no database — a single browser's saved-items list, which is all
// this app needs. Deliberately not a Context/reducer — one hook, one array,
// used from App.jsx and passed down as props (see components that accept
// `isWishlisted`/`onToggleWishlist`).
const STORAGE_KEY = "luma-wishlist";

function readStoredWishlist() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt/unavailable storage (private browsing, quota, bad JSON) —
    // start empty rather than throwing.
    return [];
  }
}

export function useWishlist() {
  const [items, setItems] = useState(readStoredWishlist);

  // Persist on every change. Runs after the render that changed `items`,
  // never synchronously inside an effect that also sets state — this effect
  // only writes to an external system (localStorage), it never calls
  // setState itself.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable — the wishlist still works for this session,
      // it just won't survive a refresh. Not worth surfacing as an error.
    }
  }, [items]);

  const isWishlisted = useCallback((productId) => items.some((item) => item.id === productId), [items]);

  const addItem = useCallback((product) => {
    setItems((prev) => (prev.some((item) => item.id === product.id) ? prev : [...prev, product]));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // Returns the resulting action ("added" | "removed") so callers (e.g. a
  // toast) can show the right message without re-deriving prior state.
  // `alreadyIn` is computed from `items` directly (not from inside the
  // setState updater below) — React does not guarantee a functional
  // updater runs synchronously, so a value can't be smuggled out of one.
  // The actual state change still uses the functional form, so it's still
  // correct even if two toggles happen before a re-render.
  const toggleItem = useCallback(
    (product) => {
      const alreadyIn = items.some((item) => item.id === product.id);
      setItems((prev) =>
        prev.some((item) => item.id === product.id)
          ? prev.filter((item) => item.id !== product.id)
          : [...prev, product]
      );
      return alreadyIn ? "removed" : "added";
    },
    [items]
  );

  return {
    items,
    count: items.length,
    isWishlisted,
    addItem,
    removeItem,
    toggleItem,
  };
}
