import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SessionState {
  token: string;
  refreshToken?: string;
  keepMeSignedIn?: boolean;
  signedIn: boolean;
}

const initialState: SessionState = {
  token: "",
  refreshToken: "",
  keepMeSignedIn: true,
  signedIn: false,
};

export const sessionSlice = createSlice({
  name: "auth/session",
  initialState,
  reducers: {
    onSignInSuccess: (state, action: PayloadAction<string>) => {
      state.signedIn = true;
      state.token = action.payload;
    },
    onSignOutSuccess: (state) => {
      state.signedIn = false;
      state.token = "";
      state.refreshToken = "";
      state.keepMeSignedIn = false;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
    },
    setKeepMeSignedIn: (state, action: PayloadAction<boolean>) => {
      state.keepMeSignedIn = action.payload;
    },
  },
});

export const {
  onSignInSuccess,
  onSignOutSuccess,
  setToken,
  setRefreshToken,
  setKeepMeSignedIn,
} = sessionSlice.actions;

export default sessionSlice.reducer;
