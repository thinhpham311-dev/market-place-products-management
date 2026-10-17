import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SessionState {
  token: string;
  signedIn: boolean;
}

const initialState: SessionState = {
  token: "demo-jwt-token-novashop",
  signedIn: true,
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
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
});

export const { onSignInSuccess, onSignOutSuccess, setToken } = sessionSlice.actions;

export default sessionSlice.reducer;
