import { useCallback, useEffect, useState } from "react";

// Wishlist state persisted to localStorage.
const STORAGE_KEY = "luma-wishlist";

function readStoredWishlist() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Storage unavailable or invalid JSON: start empty
    return [];
  }
}

export function useWishlist() {
  const [items, setItems] = useState(readStoredWishlist);

  // Save to localStorage whenever the list changes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable: keep the list in memory only
    }
  }, [items]);

  const isWishlisted = useCallback((productId) => items.some((item) => item.id === productId), [items]);

  const addItem = useCallback((product) => {
    setItems((prev) => (prev.some((item) => item.id === product.id) ? prev : [...prev, product]));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // Returns "added" or "removed" so the caller can show the right toast.
  // The update uses the functional form so rapid toggles stay correct.
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
