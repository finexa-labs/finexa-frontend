import type {
  ExpenseDraft,
  IntelligenceLimits,
  KindSuggestion,
  MappingSuggestion,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const OWNER_ID =
  process.env.NEXT_PUBLIC_OWNER_ID ?? "00000000-0000-0000-0000-000000000001";

async function apiFetch<T>(
  path: string,
  options?: { method?: "GET" | "POST" | "PATCH"; body?: unknown }
): Promise<T> {
  const method = options?.method ?? "GET";
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Owner-ID": OWNER_ID,
    },
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const intelligenceApi = {
  getLimits: () =>
    apiFetch<IntelligenceLimits>("/finance/intelligence/limits"),

  patchLimits: (data: Partial<IntelligenceLimits>) =>
    apiFetch<IntelligenceLimits>("/finance/intelligence/limits", {
      method: "PATCH",
      body: data,
    }),

  smartEntryDraft: (text: string) =>
    apiFetch<{ draft: ExpenseDraft }>("/finance/intelligence/smart-entry/draft", {
      method: "POST",
      body: { text },
    }),

  docAiDetectKind: (headers: string[], sampleRows: string[][]) =>
    apiFetch<KindSuggestion>("/finance/intelligence/doc-ai/detect-kind", {
      method: "POST",
      body: { headers, sample_rows: sampleRows },
    }),

  docAiSuggestMapping: (headers: string[], documentKind: string) =>
    apiFetch<MappingSuggestion>("/finance/intelligence/doc-ai/suggest-mapping", {
      method: "POST",
      body: { headers, document_kind: documentKind },
    }),
};
