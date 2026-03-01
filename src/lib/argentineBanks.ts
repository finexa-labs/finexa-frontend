export interface BankConfig {
  id: string;
  name: string;
  abbr: string;
  defaultColor: string;
  category: "wallet" | "bank" | "other";
}

export const ARGENTINA_BANKS: BankConfig[] = [
  { id: "mercado_pago",    name: "Mercado Pago",     abbr: "MP",  defaultColor: "#00b1ea", category: "wallet" },
  { id: "brubank",         name: "Brubank",           abbr: "BB",  defaultColor: "#6200ea", category: "bank"   },
  { id: "naranja_x",      name: "Naranja X",          abbr: "NX",  defaultColor: "#ff6200", category: "wallet" },
  { id: "uala",           name: "Ualá",               abbr: "UA",  defaultColor: "#7c3aed", category: "wallet" },
  { id: "lemon",          name: "Lemon Cash",         abbr: "LM",  defaultColor: "#00c853", category: "wallet" },
  { id: "prex",           name: "Prex",               abbr: "PX",  defaultColor: "#0057ff", category: "wallet" },
  { id: "personal_pay",   name: "Personal Pay",       abbr: "PP",  defaultColor: "#e91e63", category: "wallet" },
  { id: "banco_nacion",   name: "Banco Nación",       abbr: "BNA", defaultColor: "#005fa3", category: "bank"   },
  { id: "banco_provincia",name: "Banco Provincia",    abbr: "BPR", defaultColor: "#1a237e", category: "bank"   },
  { id: "santander",      name: "Santander",          abbr: "SAN", defaultColor: "#ec0000", category: "bank"   },
  { id: "galicia",        name: "Galicia",             abbr: "GAL", defaultColor: "#ff0000", category: "bank"   },
  { id: "bbva",           name: "BBVA",               abbr: "BBV", defaultColor: "#004481", category: "bank"   },
  { id: "macro",          name: "Macro",              abbr: "MAC", defaultColor: "#f9a825", category: "bank"   },
  { id: "icbc",           name: "ICBC",               abbr: "ICB", defaultColor: "#c0392b", category: "bank"   },
  { id: "supervielle",    name: "Supervielle",        abbr: "SUP", defaultColor: "#e65100", category: "bank"   },
  { id: "efectivo",       name: "Efectivo",           abbr: "EFE", defaultColor: "#388e3c", category: "other"  },
  { id: "otro",           name: "Otro",               abbr: "OTR", defaultColor: "#6366f1", category: "other"  },
];

export function getBankConfig(bankType: string | null | undefined): BankConfig | undefined {
  if (!bankType) return undefined;
  return ARGENTINA_BANKS.find((b) => b.id === bankType);
}
