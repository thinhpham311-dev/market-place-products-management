import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark" | "system";
export type SidebarTheme = "adaptive" | "indigo" | "emerald" | "violet" | "slate";
export type StoreBranchId = "hn_main" | "hcm_south" | "dn_central" | "hp_port";

export interface ThemeState {
  mode: ThemeMode;
  sidebarTheme: SidebarTheme;
  activeBranchId: StoreBranchId;
}

const initialState: ThemeState = {
  mode: "light",
  sidebarTheme: "adaptive",
  activeBranchId: "hn_main",
};

const themeSlice = createSlice({
  name: "settings/theme",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleThemeMode(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
    },
    setSidebarTheme(state, action: PayloadAction<SidebarTheme>) {
      state.sidebarTheme = action.payload;
    },
    setActiveBranch(state, action: PayloadAction<StoreBranchId>) {
      state.activeBranchId = action.payload;
    },
  },
});

export const { setThemeMode, toggleThemeMode, setSidebarTheme, setActiveBranch } =
  themeSlice.actions;
export default themeSlice.reducer;
