import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserState } from "./userSlice";

export interface RegisteredAccount {
  email: string;
  password: string;
  user: UserState;
  badgeColor: string;
  createdAt?: string;
}

export interface AccountsState {
  items: RegisteredAccount[];
}

export const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    email: "admin@novashop.vn",
    password: "123456",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d1",
      avatar: "AD",
      userName: "Admin Shop",
      email: "admin@novashop.vn",
      role: "Chủ gian hàng",
      authority: ["admin", "owner"],
    },
    badgeColor: "from-indigo-500 to-violet-600",
  },
  {
    email: "warehouse@novashop.vn",
    password: "123456",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d2",
      avatar: "KH",
      userName: "Trần Minh Kho",
      email: "warehouse@novashop.vn",
      role: "Quản lý kho vận",
      authority: ["warehouse", "inventory"],
    },
    badgeColor: "from-emerald-500 to-teal-600",
  },
  {
    email: "sale@novashop.vn",
    password: "123456",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d3",
      avatar: "SL",
      userName: "Lê Thu Hà",
      email: "sale@novashop.vn",
      role: "Vận hành Sàn TMĐT",
      authority: ["sales", "marketing"],
    },
    badgeColor: "from-amber-500 to-orange-600",
  },
];

const initialState: AccountsState = {
  items: DEFAULT_ACCOUNTS,
};

export const accountsSlice = createSlice({
  name: "auth/accounts",
  initialState,
  reducers: {
    registerAccount: (state, action: PayloadAction<RegisteredAccount>) => {
      if (!state.items) {
        state.items = [...DEFAULT_ACCOUNTS];
      }
      const exists = state.items.some(
        (acc) => acc.email.toLowerCase() === action.payload.email.toLowerCase()
      );
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
  },
});

export const { registerAccount } = accountsSlice.actions;
export default accountsSlice.reducer;
