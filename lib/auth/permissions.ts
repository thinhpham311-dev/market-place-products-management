import { useAppSelector } from '@/store/hooks';

export const CATEGORY_BRAND_ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'CATEGORY_MANAGER',
  'CATALOG_SPECIALIST',
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
