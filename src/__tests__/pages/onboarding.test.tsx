/**
 * Tests for the Onboarding page.
 *
 * Covers:
 *  - Platform selector renders all three platforms
 *  - Clicking a platform shows the correct credential fields
 *  - Sensitive fields (token, secret) are type="password"
 *  - Credential fields change when a different platform is selected
 *  - Submit button is disabled until all fields are filled
 *  - Successful ingestion shows success message
 *  - Failed ingestion shows error message
 *  - Simultaneous POST to orders AND inventory endpoints
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/onboarding/page";

// Mock the API module
jest.mock("@/lib/api", () => ({
  ingestOrders: jest.fn(),
  ingestInventory: jest.fn(),
}));

// Mock AppShell to render children directly
jest.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { ingestOrders, ingestInventory } from "@/lib/api";

const mockIngestOrders = ingestOrders as jest.Mock;
const mockIngestInventory = ingestInventory as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockIngestOrders.mockResolvedValue({ ok: true });
  mockIngestInventory.mockResolvedValue({ ok: true });
});

// ─── Platform selector ────────────────────────────────────────────────────────

describe("Platform selector", () => {
  it("renders all three platform buttons", () => {
    render(<OnboardingPage />);
    expect(screen.getByRole("button", { name: "Tiendanube" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shopify" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "WooCommerce" })).toBeInTheDocument();
  });

  it("shows no credential fields before a platform is selected", () => {
    render(<OnboardingPage />);
    expect(screen.queryByLabelText(/store_id|shop_domain|site_url/i)).not.toBeInTheDocument();
  });

  it("highlights the selected platform button", () => {
    render(<OnboardingPage />);
    const btn = screen.getByRole("button", { name: "Tiendanube" });
    fireEvent.click(btn);
    expect(btn.className).toMatch(/finexa-500|border-finexa/);
  });
});

// ─── Tiendanube credentials ───────────────────────────────────────────────────

describe("Tiendanube credential form", () => {
  beforeEach(() => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByRole("button", { name: "Tiendanube" }));
  });

  it("shows store_id and access_token fields", () => {
    expect(screen.getByLabelText(/ID de tienda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Access token/i)).toBeInTheDocument();
  });

  it("renders access_token as password input", () => {
    const tokenField = screen.getByLabelText(/Access token/i);
    expect(tokenField).toHaveAttribute("type", "password");
  });

  it("does NOT render Shopify-specific fields", () => {
    expect(screen.queryByLabelText(/Dominio de tienda/i)).not.toBeInTheDocument();
  });
});

// ─── Shopify credentials ──────────────────────────────────────────────────────

describe("Shopify credential form", () => {
  beforeEach(() => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByRole("button", { name: "Shopify" }));
  });

  it("shows shop_domain and access_token fields", () => {
    expect(screen.getByLabelText(/Dominio de tienda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Access token/i)).toBeInTheDocument();
  });

  it("renders access_token as password input", () => {
    expect(screen.getByLabelText(/Access token/i)).toHaveAttribute("type", "password");
  });

  it("does NOT show tiendanube store_id field", () => {
    expect(screen.queryByLabelText(/ID de tienda/i)).not.toBeInTheDocument();
  });
});

// ─── WooCommerce credentials ──────────────────────────────────────────────────

describe("WooCommerce credential form", () => {
  beforeEach(() => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByRole("button", { name: "WooCommerce" }));
  });

  it("shows site_url, consumer_key and consumer_secret fields", () => {
    expect(screen.getByLabelText(/URL del sitio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Consumer key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Consumer secret/i)).toBeInTheDocument();
  });

  it("renders consumer_key as password input", () => {
    expect(screen.getByLabelText(/Consumer key/i)).toHaveAttribute("type", "password");
  });

  it("renders consumer_secret as password input", () => {
    expect(screen.getByLabelText(/Consumer secret/i)).toHaveAttribute("type", "password");
  });

  it("site_url is a plain text input (not password)", () => {
    expect(screen.getByLabelText(/URL del sitio/i)).toHaveAttribute("type", "text");
  });
});

// ─── Platform switching resets credentials ────────────────────────────────────

describe("Platform switching", () => {
  it("clears credential fields when switching platforms", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    // Select Tiendanube and fill a field
    await user.click(screen.getByRole("button", { name: "Tiendanube" }));
    const storeIdField = screen.getByLabelText(/ID de tienda/i);
    await user.type(storeIdField, "12345");
    expect(storeIdField).toHaveValue("12345");

    // Switch to Shopify — Tiendanube fields should be gone and fields reset
    await user.click(screen.getByRole("button", { name: "Shopify" }));
    expect(screen.queryByLabelText(/ID de tienda/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Dominio de tienda/i)).toHaveValue("");
  });
});

// ─── Submit button state ──────────────────────────────────────────────────────

describe("Ingesta button enabled/disabled state", () => {
  it("is disabled before selecting a platform", () => {
    render(<OnboardingPage />);
    expect(screen.getByRole("button", { name: /Iniciar ingesta/i })).toBeDisabled();
  });

  it("is disabled after selecting platform but before filling credentials", () => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByRole("button", { name: "Tiendanube" }));
    expect(screen.getByRole("button", { name: /Iniciar ingesta/i })).toBeDisabled();
  });

  it("enables when all Tiendanube fields are filled", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "Tiendanube" }));
    await user.type(screen.getByLabelText(/ID de tienda/i), "123");
    await user.type(screen.getByLabelText(/Access token/i), "tok");

    expect(screen.getByRole("button", { name: /Iniciar ingesta/i })).toBeEnabled();
  });

  it("stays disabled when only some Shopify fields are filled", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "Shopify" }));
    await user.type(screen.getByLabelText(/Dominio de tienda/i), "tienda.myshopify.com");
    // access_token left empty

    expect(screen.getByRole("button", { name: /Iniciar ingesta/i })).toBeDisabled();
  });

  it("enables when all WooCommerce fields are filled", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "WooCommerce" }));
    await user.type(screen.getByLabelText(/URL del sitio/i), "https://tienda.com");
    await user.type(screen.getByLabelText(/Consumer key/i), "ck_xxx");
    await user.type(screen.getByLabelText(/Consumer secret/i), "cs_xxx");

    expect(screen.getByRole("button", { name: /Iniciar ingesta/i })).toBeEnabled();
  });
});

// ─── Ingesta submission ───────────────────────────────────────────────────────

describe("Ingesta submission", () => {
  async function fillAndSubmitTiendanube() {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "Tiendanube" }));
    await user.type(screen.getByLabelText(/ID de tienda/i), "42");
    await user.type(screen.getByLabelText(/Access token/i), "my-token");
    await user.click(screen.getByRole("button", { name: /Iniciar ingesta/i }));
    return user;
  }

  it("calls ingestOrders with correct payload", async () => {
    await fillAndSubmitTiendanube();
    await waitFor(() => expect(mockIngestOrders).toHaveBeenCalledTimes(1));
    expect(mockIngestOrders).toHaveBeenCalledWith({
      platform: "tiendanube",
      credentials: { store_id: "42", access_token: "my-token" },
    });
  });

  it("calls ingestInventory with same payload", async () => {
    await fillAndSubmitTiendanube();
    await waitFor(() => expect(mockIngestInventory).toHaveBeenCalledTimes(1));
    expect(mockIngestInventory).toHaveBeenCalledWith({
      platform: "tiendanube",
      credentials: { store_id: "42", access_token: "my-token" },
    });
  });

  it("calls both endpoints (orders and inventory) in the same submission", async () => {
    await fillAndSubmitTiendanube();
    await waitFor(() => {
      expect(mockIngestOrders).toHaveBeenCalledTimes(1);
      expect(mockIngestInventory).toHaveBeenCalledTimes(1);
    });
  });

  it("shows success message after successful ingestion", async () => {
    await fillAndSubmitTiendanube();
    await waitFor(() =>
      expect(screen.getByText(/Ingesta iniciada correctamente/i)).toBeInTheDocument()
    );
  });

  it("shows error message when API fails", async () => {
    mockIngestOrders.mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "Tiendanube" }));
    await user.type(screen.getByLabelText(/ID de tienda/i), "99");
    await user.type(screen.getByLabelText(/Access token/i), "bad-token");
    await user.click(screen.getByRole("button", { name: /Iniciar ingesta/i }));

    await waitFor(() =>
      expect(screen.getByText(/Error al conectar/i)).toBeInTheDocument()
    );
  });

  it("shows loading text during submission", async () => {
    // Delay resolution so we can catch the loading state
    mockIngestOrders.mockReturnValue(new Promise(() => {}));
    mockIngestInventory.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "Tiendanube" }));
    await user.type(screen.getByLabelText(/ID de tienda/i), "1");
    await user.type(screen.getByLabelText(/Access token/i), "t");
    await user.click(screen.getByRole("button", { name: /Iniciar ingesta/i }));

    expect(screen.getByText(/Sincronizando/i)).toBeInTheDocument();
  });
});
