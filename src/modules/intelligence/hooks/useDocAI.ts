"use client";

import { useState } from "react";
import { intelligenceApi } from "../api";
import type { KindSuggestion, MappingSuggestion } from "../types";

interface UseDocAIReturn {
  kindSuggestion: KindSuggestion | null;
  mappingSuggestion: MappingSuggestion | null;
  kindLoading: boolean;
  mappingLoading: boolean;
  kindError: string | null;
  mappingError: string | null;
  detectKind: (headers: string[], sampleRows: string[][]) => Promise<void>;
  suggestMapping: (headers: string[], documentKind: string) => Promise<void>;
  dismissKind: () => void;
  dismissMapping: () => void;
}

export function useDocAI(): UseDocAIReturn {
  const [kindSuggestion, setKindSuggestion] = useState<KindSuggestion | null>(null);
  const [mappingSuggestion, setMappingSuggestion] = useState<MappingSuggestion | null>(null);
  const [kindLoading, setKindLoading] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [kindError, setKindError] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);

  async function detectKind(headers: string[], sampleRows: string[][]) {
    setKindLoading(true);
    setKindError(null);
    try {
      const result = await intelligenceApi.docAiDetectKind(headers, sampleRows);
      setKindSuggestion({ ...result, source: "ai" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "error";
      setKindError(msg);
    } finally {
      setKindLoading(false);
    }
  }

  async function suggestMapping(headers: string[], documentKind: string) {
    setMappingLoading(true);
    setMappingError(null);
    try {
      const result = await intelligenceApi.docAiSuggestMapping(headers, documentKind);
      setMappingSuggestion(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "error";
      setMappingError(msg);
    } finally {
      setMappingLoading(false);
    }
  }

  return {
    kindSuggestion,
    mappingSuggestion,
    kindLoading,
    mappingLoading,
    kindError,
    mappingError,
    detectKind,
    suggestMapping,
    dismissKind: () => setKindSuggestion(null),
    dismissMapping: () => setMappingSuggestion(null),
  };
}
