import { useEffect, useState } from "react";
import HowLumaWorks from "./components/HowLumaWorks";
import ProductModal from "./components/ProductModal";
import WishlistToast from "./components/WishlistToast";

import { Navbar } from "./components/sections/Navbar";
import { Hero } from "./components/sections/Hero";
import { CollectionGrid } from "./components/sections/CollectionGrid";
import { AIRecommendation } from "./components/sections/AIRecommendation";
import { StyleQuiz } from "./components/sections/StyleQuiz";
import { TrustSection } from "./components/sections/TrustSection";
import { Testimonials } from "./components/sections/Testimonials";
import { Footer } from "./components/sections/Footer";
import { ProductCard } from "./components/ui/ProductCard";
import { SmoothScroll } from "./components/ui/SmoothScroll";
import { LumaConcierge } from "./components/Concierge/LumaConcierge";
import { WishlistPanel } from "./components/Wishlist/WishlistPanel";

import { getProducts } from "./lib/api";
import { useWishlist } from "./hooks/useWishlist";

function App() {
  const [products, setProducts] = useState([]);
  // Effect below runs once on mount ([] deps) — these already start at the
  // correct "loading" values, so there's nothing to reset synchronously
  // inside the effect body itself (see the react-hooks/set-state-in-effect
  // rule this previously tripped).
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  // Only ever set inside an async callback (the setTimeout below), never
  // synchronously in an effect body — see the react-hooks/set-state-in-effect
  // note above.
  const [showColdStartHint, setShowColdStartHint] = useState(false);

  const wishlist = useWishlist();

  useEffect(() => {
    let isCancelled = false;

    getProducts()
      .then((data) => {
        if (isCancelled) return;
        setProducts(data?.items ?? []);
      })
      .catch(() => {
        if (isCancelled) return;
        // User-friendly only — never surface the raw ApiError/status/backend detail here.
        setProductsError("We couldn't load the collection right now. Please try again shortly.");
      })
      .finally(() => {
        if (isCancelled) return;
        setIsLoadingProducts(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // The Render free-tier backend can take 30-60s to wake from a cold start.
  // Rather than leaving a bare "Loading…" indefinitely, add an honest
  // explanation after a few seconds. The state update lives inside the
  // setTimeout callback (async), not synchronously in the effect body.
  useEffect(() => {
    if (!isLoadingProducts) return undefined;
    const timer = setTimeout(() => setShowColdStartHint(true), 6000);
    return () => clearTimeout(timer);
  }, [isLoadingProducts]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseProduct = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Toggles real wishlist membership (see src/hooks/useWishlist.js) and
  // shows a short toast reflecting what actually happened — "added" or
  // "removed" — rather than always claiming "added".
  const handleWishlist = (product) => {
    const action = wishlist.toggleItem(product);
    setWishlistMessage(
      action === "added" ? `${product.name} added to your wishlist` : `${product.name} removed from your wishlist`
    );

    setTimeout(() => {
      setWishlistMessage("");
    }, 2200);
  };

  // Concierge and the wishlist are both fixed-position slide-in panels in
  // the same corner (see LumaConcierge.jsx / WishlistPanel.jsx) — only one
  // should ever be open at once, so opening either closes the other.
  const handleToggleConcierge = () => {
    setIsConciergeOpen((prev) => {
      const next = !prev;
      if (next) setIsWishlistOpen(false);
      return next;
    });
  };

  const handleOpenWishlist = () => {
    setIsConciergeOpen(false);
    setIsWishlistOpen(true);
  };

  const handleCloseWishlist = () => {
    setIsWishlistOpen(false);
  };

  const handleExploreCollection = () => {
    document.querySelector("#collections")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleWishlistProductClick = (product) => {
    setIsWishlistOpen(false);
    handleProductClick(product);
  };

  return (
    <SmoothScroll>
      <div className="relative min-h-screen bg-white">
        <Navbar
          onToggleConcierge={handleToggleConcierge}
          wishlistCount={wishlist.count}
          onOpenWishlist={handleOpenWishlist}
        />

        <main>
          <Hero onFindMyStyle={handleToggleConcierge} onExploreCollection={handleExploreCollection} />

          <CollectionGrid />

          <HowLumaWorks />

          {/* Live product grid — the one section on this page backed by the
              real FastAPI catalog (GET /products), not static/demo data. */}
          <section id="collection-grid" className="bg-white px-6 py-32 md:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-24 text-center">
                <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.5em] text-graphite/30">
                  The Full Edit
                </span>

                <h2 className="text-5xl tracking-tighter md:text-7xl">
                  Your{" "}
                  <span className="text-champagne-800/80 underline decoration-champagne/30 underline-offset-12 italic font-light">
                    Matches
                  </span>
                </h2>
              </div>

              {isLoadingProducts && (
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-graphite/40">Loading the collection…</p>
                  {showColdStartHint && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-graphite/30">
                      Our free-tier server can take up to a minute to wake up on its first request.
                    </p>
                  )}
                </div>
              )}

              {!isLoadingProducts && productsError && (
                <p className="text-center text-[11px] uppercase tracking-[0.3em] text-graphite/40">
                  {productsError}
                </p>
              )}

              {!isLoadingProducts && !productsError && (
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-16">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                      onView={() => handleProductClick(product)}
                      onWishlist={() => handleWishlist(product)}
                      isWishlisted={wishlist.isWishlisted(product.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <AIRecommendation />

          <StyleQuiz />

          <TrustSection />

          <Testimonials />
        </main>

        <Footer />

        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseProduct}
          onWishlist={handleWishlist}
          isWishlisted={selectedProduct ? wishlist.isWishlisted(selectedProduct.id) : false}
        />

        <WishlistPanel
          isOpen={isWishlistOpen}
          onClose={handleCloseWishlist}
          items={wishlist.items}
          onRemove={wishlist.removeItem}
          onProductClick={handleWishlistProductClick}
        />

        <WishlistToast message={wishlistMessage} />

        <LumaConcierge
          isOpen={isConciergeOpen}
          onClose={handleToggleConcierge}
          onProductClick={handleProductClick}
        />
      </div>
    </SmoothScroll>
  );
}

export default App;