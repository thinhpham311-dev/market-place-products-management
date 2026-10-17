import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  avatar: string;
  userName: string;
  email: string;
  role: string;
  authority: string[];
}

export const initialState: UserState = {
  avatar: "AD",
  userName: "Admin Shop",
  email: "admin@novashop.vn",
  role: "Chủ gian hàng",
  authority: ["admin", "owner"],
};

export const emptyUserState: UserState = {
  avatar: "",
  userName: "",
  email: "",
  role: "",
  authority: [],
};

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
