import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LumaConcierge } from "./LumaConcierge";
import { sendConciergeMessage } from "../../lib/api";

// The API call is mocked; backend behaviour is covered by the backend tests.
vi.mock("../../lib/api", () => ({
  sendConciergeMessage: vi.fn(),
}));

describe("LumaConcierge", () => {
  beforeEach(() => {
    sendConciergeMessage.mockReset();
  });

  it("renders real recommended products returned by the backend, not fabricated ones", async () => {
    sendConciergeMessage.mockResolvedValue({
      message: "Here's a piece under $5,000.",
      recommended_products: [
        { id: 1, name: "Astraea Diamond Ring", category: "Rings", price_display: "$2,450", image: "/ring.jpg" },
      ],
      tools_used: ["filter_products"],
      applied_filters: { max_price: 5000 },
      trace: [],
    });

    const user = userEvent.setup();
    render(<LumaConcierge isOpen onClose={() => {}} onProductClick={() => {}} />);

    await user.type(screen.getByLabelText(/message luma concierge/i), "Show me something under $5000");
    await user.keyboard("{Enter}");

    expect(sendConciergeMessage).toHaveBeenCalledWith("Show me something under $5000");
    expect(await screen.findByText("Here's a piece under $5,000.")).toBeInTheDocument();
    expect(screen.getByText("Astraea Diamond Ring")).toBeInTheDocument();
  });

  it("shows a friendly error message (never a raw error) when the backend call fails, with a working retry", async () => {
    sendConciergeMessage.mockRejectedValueOnce(new Error("Network error / 503 / stack trace, etc."));
    sendConciergeMessage.mockResolvedValueOnce({
      message: "Here's what I found.",
      recommended_products: [],
      tools_used: [],
      applied_filters: null,
      trace: [],
    });

    const user = userEvent.setup();
    render(<LumaConcierge isOpen onClose={() => {}} onProductClick={() => {}} />);

    await user.type(screen.getByLabelText(/message luma concierge/i), "hello");
    await user.keyboard("{Enter}");

    const errorMessage = await screen.findByText("I couldn't get a response just now. Please try again.");
    expect(errorMessage).toBeInTheDocument();
    // The raw Error's message must never reach the UI.
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(sendConciergeMessage).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Here's what I found.")).toBeInTheDocument();
  });

  it("shows a chat-limit message when the backend returns 429", async () => {
    sendConciergeMessage.mockRejectedValueOnce(Object.assign(new Error("Too Many Requests"), { status: 429 }));

    const user = userEvent.setup();
    render(<LumaConcierge isOpen onClose={() => {}} onProductClick={() => {}} />);

    await user.type(screen.getByLabelText(/message luma concierge/i), "hello");
    await user.keyboard("{Enter}");

    expect(
      await screen.findByText("You've reached the chat limit for now. Please try again in a while.")
    ).toBeInTheDocument();
  });

  it("does not call the backend for a blank/whitespace-only message", async () => {
    const user = userEvent.setup();
    render(<LumaConcierge isOpen onClose={() => {}} onProductClick={() => {}} />);

    await user.type(screen.getByLabelText(/message luma concierge/i), "   ");
    await user.keyboard("{Enter}");

    expect(sendConciergeMessage).not.toHaveBeenCalled();
  });
});
