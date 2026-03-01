"use client";

import { useState } from "react";
import { intelligenceApi } from "../api";
import type { ExpenseDraft, SmartEntryState } from "../types";

interface UseSmartEntryReturn {
  state: SmartEntryState;
  setText: (t: string) => void;
  generate: () => Promise<void>;
  discard: () => void;
  confirm: (draft: ExpenseDraft) => ExpenseDraft;
}

export function useSmartEntry(): UseSmartEntryReturn {
  const [state, setState] = useState<SmartEntryState>({
    status: "idle",
    text: "",
    draft: null,
    error: null,
  });

  function setText(text: string) {
    setState((s) => ({ ...s, text, status: "idle", error: null }));
  }

  async function generate() {
    if (!state.text.trim()) return;
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { draft } = await intelligenceApi.smartEntryDraft(state.text);
      setState((s) => ({ ...s, status: "draft", draft }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "error";
      setState((s) => ({ ...s, status: "error", error: msg }));
    }
  }

  function discard() {
    setState({ status: "idle", text: "", draft: null, error: null });
  }

  function confirm(draft: ExpenseDraft): ExpenseDraft {
    setState((s) => ({ ...s, status: "confirmed" }));
    return draft;
  }

  return { state, setText, generate, discard, confirm };
}
