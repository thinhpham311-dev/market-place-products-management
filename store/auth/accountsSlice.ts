import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserState } from "./userSlice";

export interface RegisteredAccount {
  email: string;
  password: string;
  phone?: string;
  address?: string;
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
    phone: "0901234567",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d1",
      avatar: "SA",
      userName: "Admin Shop (Root)",
      email: "admin@novashop.vn",
      phone: "0901234567",
      role: "SUPER_ADMIN",
      authority: ["SUPER_ADMIN", "admin"],
    },
    badgeColor: "from-purple-600 to-violet-700",
  },
  {
    email: "owneradmin@novashop.vn",
    password: "novashop",
    phone: "0909888999",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d8",
      avatar: "OA",
      userName: "Owner Admin",
      email: "owneradmin@novashop.vn",
      phone: "0909888999",
      role: "SHOP_OWNER",
      authority: ["SHOP_OWNER"],
    },
    badgeColor: "from-blue-600 to-indigo-600",
  },
  {
    email: "owner@novashop.vn",
    password: "novashop",
    phone: "0912345678",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d9",
      avatar: "SO",
      userName: "Trần Minh (Shop Owner)",
      email: "owner@novashop.vn",
      phone: "0912345678",
      role: "SHOP_OWNER",
      authority: ["SHOP_OWNER", "owner"],
    },
    badgeColor: "from-indigo-600 to-blue-600",
  },
  {
    email: "category@novashop.vn",
    password: "123456",
    phone: "0923456789",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d4",
      avatar: "CM",
      userName: "Category Manager",
      email: "category@novashop.vn",
      phone: "0923456789",
      role: "CATEGORY_MANAGER",
      authority: ["CATEGORY_MANAGER"],
    },
    badgeColor: "from-purple-500 to-pink-600",
  },
  {
    email: "catalog@novashop.vn",
    password: "123456",
    phone: "0934567890",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d5",
      avatar: "CS",
      userName: "Catalog Specialist",
      email: "catalog@novashop.vn",
      phone: "0934567890",
      role: "CATALOG_SPECIALIST",
      authority: ["CATALOG_SPECIALIST"],
    },
    badgeColor: "from-cyan-500 to-blue-600",
  },
  {
    email: "warehouse@novashop.vn",
    password: "123456",
    phone: "0945678901",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d2",
      avatar: "KH",
      userName: "Trần Minh Kho",
      email: "warehouse@novashop.vn",
      phone: "0945678901",
      role: "Kho vận - không có quyền Category/Brand",
      authority: ["warehouse", "inventory"],
    },
    badgeColor: "from-emerald-500 to-teal-600",
  },
  {
    email: "sale@novashop.vn",
    password: "123456",
    phone: "0956789012",
    user: {
      id: "66f1a2b3c4d5e6f7a8b9c0d3",
      avatar: "SL",
      userName: "Lê Thu Hà",
      email: "sale@novashop.vn",
      phone: "0956789012",
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

  // Add default accounts first as base
  for (const def of DEFAULT_ACCOUNTS) {
    accountMap.set(def.email.toLowerCase(), def);
  }

  // Merge or append persisted accounts (including updated database info)
  for (const acc of persisted) {
    const key = acc.email.toLowerCase();
    const existing = accountMap.get(key);
    if (existing) {
      const fixedRole =
        key === "admin@novashop.vn"
          ? "SUPER_ADMIN"
          : key === "owneradmin@novashop.vn"
          ? "SHOP_OWNER"
          : acc.user?.role || existing.user.role;

      const fixedAuthority =
        key === "admin@novashop.vn"
          ? ["SUPER_ADMIN", "admin"]
          : key === "owneradmin@novashop.vn"
          ? ["SHOP_OWNER"]
          : acc.user?.authority || existing.user.authority;

      accountMap.set(key, {
        ...existing,
        ...acc,
        user: {
          ...existing.user,
          ...acc.user,
          role: fixedRole,
          authority: fixedAuthority,
        },
      });
    } else {
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
    updateAccountInfo: (
      state,
      action: PayloadAction<{
        email: string;
        user: Partial<UserState>;
        password?: string;
      }>
    ) => {
      if (!state.items) {
        state.items = [...DEFAULT_ACCOUNTS];
      }
      const item = state.items.find(
        (acc) => acc.email.toLowerCase() === action.payload.email.toLowerCase()
      );
      if (item) {
        if (action.payload.password) {
          item.password = action.payload.password;
        }
        item.user = {
          ...item.user,
          ...action.payload.user,
        };
      }
    },
  },
});

export const { registerAccount, updateAccountInfo } = accountsSlice.actions;
export default accountsSlice.reducer;
