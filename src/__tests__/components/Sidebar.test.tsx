/**
 * Tests for the Sidebar component.
 *
 * Covers:
 *  - All navigation links are rendered
 *  - "Inventario" link exists and points to /inventory (new)
 *  - Brand name and version rendered
 *  - Each nav item has the correct href
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";

// next/link renders as an <a> in jsdom
jest.mock("next/link", () => {
  const MockLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("Sidebar — brand", () => {
  it("renders 'Finexa Labs' brand name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Finexa Labs")).toBeInTheDocument();
  });

  it("renders version label", () => {
    render(<Sidebar />);
    expect(screen.getByText(/MVP v0\.1/i)).toBeInTheDocument();
  });
});

describe("Sidebar — navigation links", () => {
  const expectedLinks = [
    { label: "Dashboard",    href: "/dashboard" },
    { label: "Onboarding",  href: "/onboarding" },
    { label: "Métricas",    href: "/metrics" },
    { label: "Inventario",  href: "/inventory" },
    { label: "Cargar datos", href: "/uploads" },
    { label: "Exports",     href: "/exports" },
  ];

  expectedLinks.forEach(({ label, href }) => {
    it(`renders "${label}" link pointing to ${href}`, () => {
      render(<Sidebar />);
      const link = screen.getByRole("link", { name: label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", href);
    });
  });

  it("renders exactly 6 navigation links", () => {
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
  });
});
