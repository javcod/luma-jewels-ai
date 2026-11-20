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
  // Starts in the loading state; the effect below fetches once on mount
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
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
        // Show a friendly message, not the raw error
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

  // The free-tier backend can take 30-60s to wake up, so explain the delay
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

  // Toggle the item and show an "added" or "removed" toast
  const handleWishlist = (product) => {
    const action = wishlist.toggleItem(product);
    setWishlistMessage(
      action === "added" ? `${product.name} added to your wishlist` : `${product.name} removed from your wishlist`
    );

    setTimeout(() => {
      setWishlistMessage("");
    }, 2200);
  };

  // Concierge and wishlist panels share a corner, so only one can be open
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

          {/* Product grid, loaded from GET /products */}
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