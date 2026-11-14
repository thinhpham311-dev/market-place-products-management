import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  id?: string;
  avatar: string;
  userName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  authority: string[];
}

export const emptyUserState: UserState = {
  avatar: "",
  userName: "",
  email: "",
  phone: "",
  address: "",
  role: "",
  authority: [],
};

export const initialState: UserState = emptyUserState;

export const userSlice = createSlice({
  name: "auth/user",
  initialState,
  reducers: {
    setUser: (_, action: PayloadAction<UserState>) => action.payload,
    userLoggedOut: () => emptyUserState,
  },
});

export const { setUser, userLoggedOut } = userSlice.actions;
export default userSlice.reducer;
