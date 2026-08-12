import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import { Button } from "../ui/Button";
import { ProductCard } from "../ui/ProductCard";
import { sendConciergeMessage } from "../../lib/api";

// Phase 5C: production-quality polish on top of Phase 5B's working
// integration. Still deliberately NOT doing: markdown rendering
// (response.message is shown as plain text, newlines preserved via CSS
// only) or a raw dump of tools_used/applied_filters/trace — those are
// distilled into one short, human-readable line per assistant turn (see
// buildActivitySummary). No new dependencies.
const SUGGESTIONS = [
  "Find a ring",
  "Show me something under $5,000",
  "Help me choose a gift",
  "Gold or silver?",
];

let messageIdCounter = 0;
const nextMessageId = () => {
  messageIdCounter += 1;
  return messageIdCounter;
};

// Maps a tool name to a short, safe, human-readable activity phrase.
// Sourced only from `tools_used` (real backend field) — never invented.
const TOOL_ACTIVITY_LABELS = {
  search_products: "Searched the catalog",
  filter_products: "Filtered the catalog",
  get_product: "Looked up a product",
  compare_products: "Compared pieces",
  check_inventory: "Checked availability",
};

function formatFilterValue(key, value) {
  if (key === "max_price") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `Under $${numeric.toLocaleString()}` : String(value);
  }
  if (key === "min_price") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `Over $${numeric.toLocaleString()}` : String(value);
  }
  return String(value);
}

// Builds one short, user-safe activity line from real response metadata
// (tools_used, applied_filters, recommended_products.length). Never reads
// or renders trace/reasoning text directly — only mechanically formats
// fields that are already safe, structured data. e.g.:
// "Searched the catalog · Applied: Rings · Under $5,000 · Found 1 piece"
function buildActivitySummary(response) {
  const parts = [];
  const seenLabels = new Set();

  (response?.tools_used ?? []).forEach((tool) => {
    const label = TOOL_ACTIVITY_LABELS[tool];
    if (label && !seenLabels.has(label)) {
      seenLabels.add(label);
      parts.push(label);
    }
  });

  const filters = response?.applied_filters;
  if (filters && Object.keys(filters).length > 0) {
    const values = Object.entries(filters).map(([key, value]) => formatFilterValue(key, value));
    parts.push(`Applied: ${values.join(" · ")}`);
  }

  const count = response?.recommended_products?.length ?? 0;
  if (count > 0) {
    parts.push(`Found ${count} piece${count === 1 ? "" : "s"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

const LumaConcierge = ({ isOpen, onClose, onProductClick }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const isSendingRef = useRef(false); // synchronous guard, immune to render-timing races

  // Auto-scroll the message list itself (never the underlying page) to the
  // newest content. Direct scrollTop assignment on the scroll container —
  // not scrollIntoView — so there is no possibility of an ancestor/page
  // scroll being triggered.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  // Focus management: move focus into the panel when it opens (input),
  // and restore focus to whatever triggered it when it closes.
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
    if (previouslyFocusedRef.current instanceof HTMLElement) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen]);

  const sendMessage = async (rawText) => {
    const trimmed = rawText.trim();
    // isSendingRef is a synchronous, render-independent lock — prevents a
    // second overlapping request from a rapid double Enter/click even if
    // React hasn't yet re-rendered with isLoading=true.
    if (!trimmed || isSendingRef.current) return;
    isSendingRef.current = true;

    setMessages((prev) => [...prev, { id: nextMessageId(), role: "user", content: trimmed }]);
    setInputValue("");
    setError(null);
    setLastFailedMessage(null);
    setIsLoading(true);

    try {
      const response = await sendConciergeMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "assistant",
          content: response?.message ?? "",
          // Real backend data only — never fabricated, never a second
          // catalog. Recommended products render via the same ProductCard
          // (compact) used everywhere else in the app.
          recommendedProducts: response?.recommended_products ?? [],
          activitySummary: buildActivitySummary(response),
        },
      ]);
    } catch {
      // User-friendly only — never surface ApiError's status/body/stack here.
      setError("I couldn't get a response just now. Please try again.");
      setLastFailedMessage(trimmed);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  const handleInputKeyDown = (event) => {
    // Enter sends; Shift+Enter inserts a newline (native textarea default).
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    // Lightweight auto-grow, capped, no external library.
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleSuggestionClick = (suggestion) => {
    // Same submit path as the form — no separate API call for suggestions.
    sendMessage(suggestion);
  };

  const hasMessages = messages.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="luma-concierge-heading"
          className="fixed inset-x-4 bottom-4 top-24 z-[998] flex flex-col overflow-hidden rounded-[1.5rem] border border-graphite/10 bg-white shadow-2xl sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:h-[min(600px,80vh)] sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-graphite/10 bg-ivory px-6 py-5">
            <div>
              <div className="flex items-center gap-2 text-champagne-800">
                <Sparkles size={16} strokeWidth={1.5} />
                <h2
                  id="luma-concierge-heading"
                  className="font-serif text-lg tracking-tight text-graphite"
                >
                  Luma Concierge
                </h2>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-graphite/40">
                Your personal jewelry stylist
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Luma Concierge"
              className="rounded-full p-2 text-graphite/50 transition-colors duration-300 hover:bg-graphite/5 hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Body: empty state OR conversation */}
          <div
            ref={scrollContainerRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with Luma Concierge"
            className="flex-1 overflow-y-auto px-6 py-6"
          >
            {!hasMessages && (
              <>
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-champagne/10 text-champagne-800 ring-1 ring-champagne/20">
                    <Sparkles size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl italic text-graphite">Your Personal Jewelry Stylist</h3>
                  <p className="mt-2 max-w-[280px] text-sm leading-6 text-graphite/60">
                    Tell me a category, budget, material, or occasion, and I'll
                    search the Luma catalog for pieces suited to you.
                  </p>
                </div>

                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-graphite/30">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                      className="rounded-full border border-graphite/10 bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-graphite/70 transition-all duration-300 hover:border-champagne/50 hover:bg-champagne/10 hover:text-graphite disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}

            {hasMessages && (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col gap-2">
                    {message.role === "assistant" && message.activitySummary && (
                      <p className="mr-auto flex max-w-[85%] items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-graphite/35">
                        <Sparkles size={10} strokeWidth={1.5} />
                        {message.activitySummary}
                      </p>
                    )}

                    <div
                      className={
                        message.role === "user"
                          ? "ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-graphite px-4 py-3 text-sm leading-6 text-ivory"
                          : "mr-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md border border-champagne/20 bg-champagne/5 px-4 py-3 text-sm leading-6 text-graphite"
                      }
                    >
                      {message.content}
                    </div>

                    {message.role === "assistant" && message.recommendedProducts?.length > 0 && (
                      <div className="mr-auto flex w-full max-w-[95%] flex-col gap-2">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-graphite/30">
                          Recommended for you
                        </p>
                        {message.recommendedProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            compact
                            onClick={() => onProductClick?.(product)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-champagne/20 bg-champagne/5 px-4 py-3.5">
                    <span className="sr-only">Luma is thinking</span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-champagne-800/50 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-champagne-800/50 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-champagne-800/50" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="border-t border-graphite/10 px-6 py-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-graphite/40">{error}</p>
              {lastFailedMessage && (
                <button
                  type="button"
                  onClick={() => sendMessage(lastFailedMessage)}
                  className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-800 underline underline-offset-4 transition-colors hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-graphite/10 bg-white px-4 py-4">
            <form className="flex items-end gap-3" onSubmit={handleSubmit}>
              <label htmlFor="luma-concierge-input" className="sr-only">
                Message Luma Concierge
              </label>
              <textarea
                ref={inputRef}
                id="luma-concierge-input"
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about rings, budget, or occasions…"
                disabled={isLoading}
                className="max-h-[120px] min-w-0 flex-1 resize-none overflow-y-auto rounded-3xl border border-graphite/15 bg-ivory/60 px-4 py-3 text-sm leading-6 text-graphite placeholder:text-graphite/35 focus:border-champagne focus:outline-none disabled:opacity-60"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isLoading}
                aria-label={isLoading ? "Sending message" : "Send message"}
                className="shrink-0 rounded-full px-4 py-3"
              >
                <Send size={16} strokeWidth={1.5} />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { LumaConcierge };
