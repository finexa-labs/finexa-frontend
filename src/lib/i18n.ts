import type esMessages from "@/locales/es.json";

/** Tipo inferido del JSON español — fuente de verdad de las claves. */
export type Messages = typeof esMessages;

/** Locales soportados. Agregar aquí para escalar. */
export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

/**
 * Resuelve una clave dot-notation en un objeto anidado.
 * Ej: resolve(messages, "nav.dashboard") → "Dashboard"
 * Retorna la clave si no se encuentra (no falla silenciosamente).
 */
export function resolveKey(obj: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

/**
 * Interpola parámetros en un string traducido.
 * Ej: interpolate("Hola {name}", { name: "Ana" }) → "Hola Ana"
 */
export function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    str
  );
}
