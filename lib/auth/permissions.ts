import { useAppSelector } from '@/store/hooks';

export const CATEGORY_BRAND_ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'SHOP_OWNER',
  'CATEGORY_MANAGER',
  'CATALOG_SPECIALIST',
  'ADMIN',
  'OWNER',
  'STORE_OWNER',
  'SHOP',
  'CHỦ_GIAN_HÀNG',
  'QUẢN_TRỊ_VIÊN',
] as const;

export type CategoryBrandRole = (typeof CATEGORY_BRAND_ALLOWED_ROLES)[number];

/**
 * Normalizes role string to uppercase with underscores (e.g. "Category Manager" -> "CATEGORY_MANAGER", "super_admin" -> "SUPER_ADMIN")
 */
export function normalizeRoleKey(roleOrAuthority?: string | null): string {
  if (!roleOrAuthority || typeof roleOrAuthority !== 'string') return '';
  return roleOrAuthority.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

/**
 * Checks whether user has the CATEGORY_MANAGER role (and not an overriding SUPER_ADMIN / ADMIN role).
 */
export function isCategoryManager(
  user?: { role?: string; authority?: string[] } | null
): boolean {
  if (!user) return false;

  const normalizedRole = normalizeRoleKey(user.role);
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN') {
    return false;
  }

  if (normalizedRole === 'CATEGORY_MANAGER') {
    return true;
  }

  if (Array.isArray(user.authority)) {
    const authKeys = user.authority.map((a) => normalizeRoleKey(a));
    if (authKeys.includes('SUPER_ADMIN') || authKeys.includes('ADMIN')) {
      return false;
    }
    if (authKeys.includes('CATEGORY_MANAGER')) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether user has SUPER_ADMIN role (Platform Root).
 */
export function isSuperAdmin(
  user?: { role?: string; authority?: string[]; email?: string } | null
): boolean {
  if (!user) return false;

  // Root platform administrator account is ALWAYS Super Admin
  if (user.email && user.email.toLowerCase().trim() === 'admin@novashop.vn') {
    return true;
  }

  const normalizedRole = normalizeRoleKey(user.role);
  const authKeys = Array.isArray(user.authority)
    ? user.authority.map((a) => normalizeRoleKey(a))
    : [];

  // Explicit SUPER_ADMIN role or authority takes highest precedence
  if (normalizedRole === 'SUPER_ADMIN' || authKeys.includes('SUPER_ADMIN')) {
    return true;
  }

  // If user role is explicitly SHOP_OWNER or merchant-only role without SUPER_ADMIN
  if (
    normalizedRole === 'SHOP_OWNER' ||
    normalizedRole === 'STORE_OWNER' ||
    normalizedRole === 'SHOP' ||
    normalizedRole === 'OWNER' ||
    normalizedRole === 'CHỦ_GIAN_HÀNG'
  ) {
    return false;
  }

  // Role ADMIN acts as Super Admin if NOT explicitly a shop owner account
  if (normalizedRole === 'ADMIN' || authKeys.includes('ADMIN')) {
    if (
      !authKeys.includes('SHOP_OWNER') &&
      !authKeys.includes('STORE_OWNER') &&
      user.email?.toLowerCase().trim() !== 'owneradmin@novashop.vn'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether user has SHOP_OWNER role (Merchant Scope - Chuỗi Cửa Hàng).
 */
export function isShopOwner(
  user?: { role?: string; authority?: string[]; email?: string } | null
): boolean {
  if (!user) return false;

  // Super Admin is platform root administrator, NEVER a shop owner
  if (isSuperAdmin(user)) {
    return false;
  }

  // Explicit shop owner accounts
  if (
    user.email &&
    (user.email.toLowerCase().trim() === 'owneradmin@novashop.vn' ||
      user.email.toLowerCase().trim() === 'owner@novashop.vn')
  ) {
    return true;
  }

  const normalizedRole = normalizeRoleKey(user.role);
  const authKeys = Array.isArray(user.authority)
    ? user.authority.map((a) => normalizeRoleKey(a))
    : [];

  // If explicitly designated as SHOP_OWNER, STORE_OWNER, SHOP, OWNER
  if (
    normalizedRole === 'SHOP_OWNER' ||
    normalizedRole === 'STORE_OWNER' ||
    normalizedRole === 'OWNER' ||
    normalizedRole === 'SHOP' ||
    normalizedRole === 'CHỦ_GIAN_HÀNG'
  ) {
    return true;
  }

  // If authorities include SHOP_OWNER, STORE_OWNER, or SHOP
  if (
    authKeys.includes('SHOP_OWNER') ||
    authKeys.includes('STORE_OWNER') ||
    authKeys.includes('OWNER') ||
    authKeys.includes('SHOP') ||
    authKeys.includes('CHỦ_GIAN_HÀNG')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether user has permission to access product and inventory management pages.
 * Role CATEGORY_MANAGER is blocked from accessing products and inventory.
 */
export function canAccessProductsAndInventory(
  user?: { role?: string; authority?: string[] } | null
): boolean {
  if (!user) return false;
  if (isCategoryManager(user)) {
    return false;
  }
  return true;
}

/**
 * Checks whether a user has permissions to view category/brand list and controls to edit them.
 * Authorized roles: SUPER_ADMIN, CATEGORY_MANAGER, CATALOG_SPECIALIST.
 */
export function canManageCategoryAndBrand(
  user?: { role?: string; authority?: string[] } | null
): boolean {
  if (!user) return false;

  const allowedRoles = new Set<string>(CATEGORY_BRAND_ALLOWED_ROLES);

  // 1. Check user.role
  if (user.role && allowedRoles.has(normalizeRoleKey(user.role))) {
    return true;
  }

  // 2. Check user.authority array
  if (Array.isArray(user.authority)) {
    for (const auth of user.authority) {
      if (typeof auth === 'string' && allowedRoles.has(normalizeRoleKey(auth))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * React hook to quickly inspect category & brand permission in components.
 */
export function useCategoryBrandPermission() {
  const user = useAppSelector((s) => s.auth.user);
  const canManage = canManageCategoryAndBrand(user);

  return {
    canManage,
    user,
    userRole: user?.role,
    userAuthorities: user?.authority || [],
    allowedRoles: CATEGORY_BRAND_ALLOWED_ROLES,
  };
}

/**
 * React hook to quickly inspect product & inventory permission in components.
 */
export function useProductInventoryPermission() {
  const user = useAppSelector((s) => s.auth.user);
  const isCatManager = isCategoryManager(user);
  const canAccess = canAccessProductsAndInventory(user);

  return {
    canAccess,
    isCategoryManager: isCatManager,
    user,
    userRole: user?.role,
    userAuthorities: user?.authority || [],
  };
}
