import { Sparkles } from "lucide-react";
import type { FinancialSurvivalScore } from "@/types/financial";

const LABEL_COLORS: Record<string, string> = {
  Crítico:    "bg-red-100 text-red-700",
  Precaución: "bg-yellow-100 text-yellow-700",
  Saludable:  "bg-green-100 text-green-700",
  Óptimo:     "bg-finexa-100 text-finexa-700",
};

export function SurvivalScoreCard({ score }: { score: FinancialSurvivalScore }) {
  const colorClass = LABEL_COLORS[score.label] ?? "bg-gray-100 text-gray-700";
  const bullets = Array.isArray(score.explanation)
    ? score.explanation
    : [score.explanation];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">Financial Survival Score</h2>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClass}`}>
          {score.label}
        </span>
      </div>

      <p className="text-5xl font-bold text-gray-900">{score.score}</p>

      {/* Explicación: bullets si es array, párrafo si es string */}
      {bullets.length > 1 ? (
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{bullets[0]}</p>
      )}

      {/* LLM Insight — solo se muestra si viene en la respuesta */}
      {score.llm_insight && (
        <div className="bg-finexa-50 border border-finexa-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-finexa-600" />
            <span className="text-xs font-semibold text-finexa-700 uppercase tracking-wide">
              Insight IA
            </span>
          </div>
          <p className="text-sm text-finexa-900 leading-relaxed">{score.llm_insight}</p>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">Presupuesto ads recomendado </span>
        <span className="text-sm font-semibold text-gray-800">
          ${Number(score.recommended_ads_budget).toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  );
}
