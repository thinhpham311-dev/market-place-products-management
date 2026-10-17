import { en } from "./en";
import { ja } from "./ja";
import { vi } from "./vi";
import type { TranslationsByLanguage } from "./types";

export type { TranslationDictionary, TranslationKey, TranslationsByLanguage } from "./types";

export const translations = {
  en,
  vi,
  ja,
} satisfies TranslationsByLanguage;
