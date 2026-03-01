"use client";

import { useEffect, useRef, useState } from "react";
import { counterpartiesApi } from "@/lib/api";
import type { Counterparty } from "@/types/finance";
import { useT } from "@/contexts/LocaleContext";

interface CounterpartySelectProps {
  value: Counterparty | null;
  onChange: (cp: Counterparty | null) => void;
  disabled?: boolean;
}

export function CounterpartySelect({ value, onChange, disabled }: CounterpartySelectProps) {
  const t = useT();
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<Counterparty[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Buscar con debounce
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await counterpartiesApi.search(query);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (cp: Counterparty) => {
    onChange(cp);
    setQuery(cp.name);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const cp = await counterpartiesApi.create({ name: query.trim(), type: "other" });
      handleSelect(cp);
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  const showCreate =
    query.trim().length > 0 &&
    !results.some((r) => r.name.toLowerCase() === query.toLowerCase());

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null); // limpiar selección al editar
          }}
          onFocus={() => query.length > 0 && setOpen(true)}
          placeholder={t("counterparty.placeholder")}
          disabled={disabled}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {open && (results.length > 0 || showCreate) && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {results.map((cp) => (
            <li key={cp.id}>
              <button
                type="button"
                onClick={() => handleSelect(cp)}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors"
              >
                {cp.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {t(`counterparty.${cp.type}` as never) || cp.type}
                </span>
              </button>
            </li>
          ))}
          {showCreate && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full border-t border-border px-3 py-2 text-left text-sm text-accent hover:bg-secondary/50 transition-colors disabled:opacity-50"
              >
                {creating ? "Creando..." : t("counterparty.createNew").replace("{name}", query.trim())}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
