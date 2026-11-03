"use client";

import { createContext, useContext, type ReactNode } from "react";
import { type Locale, MESSAGES, type Messages } from "@/lib/i18n";

const Ctx = createContext<{ t: Messages; locale: Locale }>({ t: MESSAGES.en, locale: "en" });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <Ctx.Provider value={{ t: MESSAGES[locale], locale }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
