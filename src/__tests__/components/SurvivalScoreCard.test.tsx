/**
 * Tests for SurvivalScoreCard component.
 *
 * Covers:
 *  - Rendering score and label badge
 *  - explanation as plain string (legacy)
 *  - explanation as string array (bullet list)
 *  - llm_insight block: renders when present, absent when not
 *  - All four label/color variants
 *  - Ads budget formatting
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { SurvivalScoreCard } from "@/components/metrics/SurvivalScoreCard";
import type { FinancialSurvivalScore } from "@/types/financial";

const base: FinancialSurvivalScore = {
  score: 82,
  label: "Óptimo",
  recommended_ads_budget: 25000,
  explanation: "Todo en orden",
};

describe("SurvivalScoreCard — score and label", () => {
  it("renders the numeric score", () => {
    render(<SurvivalScoreCard score={base} />);
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("renders the label badge", () => {
    render(<SurvivalScoreCard score={base} />);
    expect(screen.getByText("Óptimo")).toBeInTheDocument();
  });

  it("applies finexa color class for Óptimo", () => {
    render(<SurvivalScoreCard score={base} />);
    const badge = screen.getByText("Óptimo");
    expect(badge.className).toMatch(/finexa/);
  });

  it("applies red class for Crítico", () => {
    render(<SurvivalScoreCard score={{ ...base, label: "Crítico", score: 10 }} />);
    const badge = screen.getByText("Crítico");
    expect(badge.className).toMatch(/red/);
  });

  it("applies yellow class for Precaución", () => {
    render(<SurvivalScoreCard score={{ ...base, label: "Precaución", score: 45 }} />);
    const badge = screen.getByText("Precaución");
    expect(badge.className).toMatch(/yellow/);
  });

  it("applies green class for Saludable", () => {
    render(<SurvivalScoreCard score={{ ...base, label: "Saludable", score: 65 }} />);
    const badge = screen.getByText("Saludable");
    expect(badge.className).toMatch(/green/);
  });
});

describe("SurvivalScoreCard — explanation as string (legacy)", () => {
  it("renders explanation as a paragraph", () => {
    render(<SurvivalScoreCard score={{ ...base, explanation: "Margen sólido" }} />);
    expect(screen.getByText("Margen sólido")).toBeInTheDocument();
    // Should NOT render a list
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("SurvivalScoreCard — explanation as string array (bullets)", () => {
  const withBullets: FinancialSurvivalScore = {
    ...base,
    explanation: ["Bullet uno", "Bullet dos", "Bullet tres"],
  };

  it("renders a list element", () => {
    render(<SurvivalScoreCard score={withBullets} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("renders every bullet as a list item", () => {
    render(<SurvivalScoreCard score={withBullets} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Bullet uno");
    expect(items[1]).toHaveTextContent("Bullet dos");
    expect(items[2]).toHaveTextContent("Bullet tres");
  });

  it("does not render a bare paragraph for each bullet", () => {
    const { container } = render(<SurvivalScoreCard score={withBullets} />);
    // Should use <ul>/<li>, not three separate <p> tags for the bullets
    const paragraphs = container.querySelectorAll("p");
    // The only <p> in the outer text area should not contain "Bullet"
    paragraphs.forEach((p) => {
      expect(p.textContent).not.toMatch(/Bullet (uno|dos|tres)/);
    });
  });

  it("single-item array renders without a list (falls back to paragraph)", () => {
    render(<SurvivalScoreCard score={{ ...base, explanation: ["Solo uno"] }} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("Solo uno")).toBeInTheDocument();
  });
});

describe("SurvivalScoreCard — llm_insight block", () => {
  it("does NOT render insight block when llm_insight is absent", () => {
    render(<SurvivalScoreCard score={base} />);
    expect(screen.queryByText(/Insight IA/i)).not.toBeInTheDocument();
  });

  it("does NOT render insight block when llm_insight is undefined", () => {
    render(<SurvivalScoreCard score={{ ...base, llm_insight: undefined }} />);
    expect(screen.queryByText(/Insight IA/i)).not.toBeInTheDocument();
  });

  it("renders insight block when llm_insight is present", () => {
    render(
      <SurvivalScoreCard
        score={{
          ...base,
          llm_insight:
            "Esta semana el negocio está en posición óptima para escalar inversión en ads.",
        }}
      />
    );
    expect(screen.getByText(/Insight IA/i)).toBeInTheDocument();
    expect(
      screen.getByText(/posición óptima para escalar/)
    ).toBeInTheDocument();
  });

  it("renders the full llm_insight text verbatim", () => {
    const text = "Texto de insight generado por IA con detalles específicos.";
    render(<SurvivalScoreCard score={{ ...base, llm_insight: text }} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("insight block disappears without error when field is removed", () => {
    const { rerender } = render(
      <SurvivalScoreCard score={{ ...base, llm_insight: "Primero" }} />
    );
    expect(screen.getByText(/Insight IA/i)).toBeInTheDocument();

    rerender(<SurvivalScoreCard score={base} />);
    expect(screen.queryByText(/Insight IA/i)).not.toBeInTheDocument();
  });
});

describe("SurvivalScoreCard — ads budget", () => {
  it("displays formatted budget", () => {
    render(<SurvivalScoreCard score={{ ...base, recommended_ads_budget: 25000 }} />);
    // es-AR locale: 25.000 or 25,000 depending on environment
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it("shows the budget label text", () => {
    render(<SurvivalScoreCard score={base} />);
    expect(screen.getByText(/Presupuesto ads recomendado/i)).toBeInTheDocument();
  });
});
