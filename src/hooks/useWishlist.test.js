import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWishlist } from "./useWishlist";

const product = { id: 1, name: "Astraea Diamond Ring", category: "Rings", price_display: "$2,450" };
const otherProduct = { id: 2, name: "Luna Pearl Earrings", category: "Earrings", price_display: "$1,120" };

describe("useWishlist", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty when nothing is stored", () => {
    const { result } = renderHook(() => useWishlist());
    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isWishlisted(1)).toBe(false);
  });

  it("adds a product and reflects it in isWishlisted/count", () => {
    const { result } = renderHook(() => useWishlist());

    act(() => {
      result.current.addItem(product);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isWishlisted(product.id)).toBe(true);
    expect(result.current.items).toEqual([product]);
  });

  it("does not add the same product twice", () => {
    const { result } = renderHook(() => useWishlist());

    act(() => {
      result.current.addItem(product);
      result.current.addItem(product);
    });

    expect(result.current.count).toBe(1);
  });

  it("removes a product", () => {
    const { result } = renderHook(() => useWishlist());

    act(() => {
      result.current.addItem(product);
      result.current.addItem(otherProduct);
    });
    act(() => {
      result.current.removeItem(product.id);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isWishlisted(product.id)).toBe(false);
    expect(result.current.isWishlisted(otherProduct.id)).toBe(true);
  });

  it("toggleItem adds when absent and reports 'added'", () => {
    const { result } = renderHook(() => useWishlist());

    let action;
    act(() => {
      action = result.current.toggleItem(product);
    });

    expect(action).toBe("added");
    expect(result.current.isWishlisted(product.id)).toBe(true);
  });

  it("toggleItem removes when present and reports 'removed'", () => {
    const { result } = renderHook(() => useWishlist());

    act(() => {
      result.current.addItem(product);
    });

    let action;
    act(() => {
      action = result.current.toggleItem(product);
    });

    expect(action).toBe("removed");
    expect(result.current.isWishlisted(product.id)).toBe(false);
  });

  it("persists to localStorage and survives a remount (page refresh)", () => {
    const { result, unmount } = renderHook(() => useWishlist());

    act(() => {
      result.current.addItem(product);
    });
    unmount();

    // Simulates a fresh page load: a brand new hook instance reads
    // whatever is already in localStorage, same key the first instance
    // wrote to.
    const { result: afterRefresh } = renderHook(() => useWishlist());
    expect(afterRefresh.current.count).toBe(1);
    expect(afterRefresh.current.isWishlisted(product.id)).toBe(true);
  });

  it("starts empty (not throwing) when localStorage holds corrupt JSON", () => {
    window.localStorage.setItem("luma-wishlist", "{not valid json");
    const { result } = renderHook(() => useWishlist());
    expect(result.current.items).toEqual([]);
  });
});
