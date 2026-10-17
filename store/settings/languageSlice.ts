import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const SUPPORTED_LANGUAGES = ["en", "vi", "ja"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageState {
  current: SupportedLanguage;
}

const initialState: LanguageState = {
  current: "vi",
};

const languageSlice = createSlice({
  name: "settings/language",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.current = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
