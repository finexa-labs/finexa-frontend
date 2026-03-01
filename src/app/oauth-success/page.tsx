"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * OAuth success page — opened in a popup by the Document Ingestion wizard.
 * Closes itself after signaling success to the parent window.
 */
export default function OAuthSuccessPage() {
  useEffect(() => {
    // Give the parent a moment to notice, then close
    const timer = setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <CheckCircle2 size={40} className="text-emerald-400" />
      <p className="text-sm text-foreground font-medium">
        Cuenta de Google conectada exitosamente
      </p>
      <p className="text-xs text-muted-foreground">
        Cerrando ventana...
      </p>
    </div>
  );
}
