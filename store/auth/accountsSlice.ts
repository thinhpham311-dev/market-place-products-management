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
    password: "novashop",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d1",
      avatar: "SA",
      userName: "Admin Shop",
      email: "admin@novashop.vn",
      role: "SUPER_ADMIN",
      authority: ["SUPER_ADMIN", "admin", "owner"],
    },
    badgeColor: "from-indigo-500 to-violet-600",
  },
  {
    email: "category@novashop.vn",
    password: "123456",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d4",
      avatar: "CM",
      userName: "Category Manager",
      email: "category@novashop.vn",
      role: "CATEGORY_MANAGER",
      authority: ["CATEGORY_MANAGER"],
    },
    badgeColor: "from-purple-500 to-pink-600",
  },
  {
    email: "catalog@novashop.vn",
    password: "123456",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d5",
      avatar: "CS",
      userName: "Catalog Specialist",
      email: "catalog@novashop.vn",
      role: "CATALOG_SPECIALIST",
      authority: ["CATALOG_SPECIALIST"],
    },
    badgeColor: "from-cyan-500 to-blue-600",
  },
  {
    email: "warehouse@novashop.vn",
    password: "123456",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d2",
      avatar: "KH",
      userName: "Trần Minh Kho",
      email: "warehouse@novashop.vn",
      role: "Kho vận - không có quyền Category/Brand",
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
      role: "Vận hành Sàn - không có quyền Category/Brand",
      authority: ["sales", "marketing"],
    },
    badgeColor: "from-amber-500 to-orange-600",
  },
];

export function mergeDefaultAccounts(
  persisted?: RegisteredAccount[]
): RegisteredAccount[] {
  if (!Array.isArray(persisted) || persisted.length === 0) {
    return DEFAULT_ACCOUNTS;
  }

  const accountMap = new Map<string, RegisteredAccount>();

  // Add updated default accounts first
  for (const def of DEFAULT_ACCOUNTS) {
    accountMap.set(def.email.toLowerCase(), def);
  }

  // Preserve user-registered accounts from local storage
  for (const acc of persisted) {
    const key = acc.email.toLowerCase();
    if (!accountMap.has(key)) {
      accountMap.set(key, acc);
    }
  }

  return Array.from(accountMap.values());
}

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
