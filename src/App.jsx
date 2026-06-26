import { useState } from "react";
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

import { products } from "./data/products";

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseProduct = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleWishlist = (product) => {
    setWishlistMessage(`${product.name} added to your Luma wishlist`);

    setTimeout(() => {
      setWishlistMessage("");
    }, 2200);
  };

  return (
    <SmoothScroll>
      <div className="relative min-h-screen bg-white">
        <Navbar />

        <main>
          <Hero />

          <CollectionGrid />

          <HowLumaWorks />

          {/* Featured AI Selection Section */}
          <section className="bg-white px-6 py-32 md:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="mb-24 text-center">
                <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.5em] text-graphite/30">
                  The Neural Edit
                </span>

                <h2 className="text-5xl tracking-tighter md:text-7xl">
                  Your{" "}
                  <span className="text-champagne-800/80 underline decoration-champagne/30 underline-offset-12 italic font-light">
                    Matches
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-16">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                    onView={() => handleProductClick(product)}
                    onWishlist={() => handleWishlist(product)}
                  />
                ))}
              </div>
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
        />

        <WishlistToast message={wishlistMessage} />
      </div>
    </SmoothScroll>
  );
}

export default App;