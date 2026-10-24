import ApiService from "./ApiService";
import { ProductCategory } from "@/types/product";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
} from "@/constants/api/api.constant";

export const NEXT_CATEGORY_ALL_LIST_ENDPOINT = "/api/category/all/list";
export const NEXT_CATEGORY_CREATE_ENDPOINT = "/api/category/create";
export const NEXT_CATEGORY_UPDATE_ENDPOINT = "/api/category/update";

export interface CreateCategoryPayload {
  category_name: string;
  category_thumb?: string;
  category_description?: string;
  category_slug?: string;
  category_active?: boolean;
  parent_id?: string | number | null;
  category_parentId?: string | number | null;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
}

export interface UpdateCategoryPayload {
  id: string;
  categoryId?: string | number;
  category_active: boolean;
  category_name?: string;
  category_slug?: string;
  category_description?: string;
  category_thumb?: string;
  parent_id?: string | number | null;
  category_parentId?: string | number | null;
}

export async function apiGetCategoryAllList(params?: Record<string, unknown>) {
  return ApiService.fetchData<Record<string, any>>({
    url: "/category/all/list",
    method: "get",
    params,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiCreateCategory(payload: CreateCategoryPayload) {
  return ApiService.fetchData<Record<string, any>>({
    url: "/category/create",
    method: "post",
    data: payload,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiUpdateCategoryStatus(payload: UpdateCategoryPayload) {
  const primaryId = String(payload.id || payload.categoryId || "").trim();
  const fallbackId =
    payload.categoryId !== undefined &&
    payload.categoryId !== null &&
    String(payload.categoryId).trim() !== primaryId
      ? String(payload.categoryId).trim()
      : undefined;

  const data: Record<string, unknown> = {
    category_active: Boolean(payload.category_active),
  };

  if (payload.category_name !== undefined) {
    data.category_name = payload.category_name;
  }
  if (payload.category_slug !== undefined) {
    data.category_slug = payload.category_slug;
  }
  if (payload.category_description !== undefined) {
    data.category_description = payload.category_description;
  }
  if (payload.category_thumb !== undefined) {
    data.category_thumb = payload.category_thumb;
  }
  if (payload.parent_id !== undefined) {
    data.parent_id = payload.parent_id;
    data.category_parentId = payload.parent_id;
  } else if (payload.category_parentId !== undefined) {
    data.parent_id = payload.category_parentId;
    data.category_parentId = payload.category_parentId;
  }
  if (fallbackId) {
    data.fallback_id = fallbackId;
  }

  return ApiService.fetchData<Record<string, any>>({
    url: `/category/update/${encodeURIComponent(primaryId)}`,
    method: "patch",
    data,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export function buildCreateCategoryPayload(input: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string | null;
  category_active?: boolean;
}): CreateCategoryPayload {
  const trimmedName = input.name.trim();
  const resolvedSlug =
    input.slug?.trim() ||
    trimmedName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const trimmedThumb = input.image?.trim() || "";
  const trimmedDesc = input.description?.trim() || "";
  const resolvedParentId =
    input.parentId && input.parentId.trim() ? input.parentId.trim() : null;

  return {
    category_name: trimmedName,
    category_slug: resolvedSlug,
    category_description: trimmedDesc,
    category_thumb: trimmedThumb,
    category_active: input.category_active ?? false,
    parent_id: resolvedParentId,
    category_parentId: resolvedParentId,
    name: trimmedName,
    slug: resolvedSlug,
    description: trimmedDesc,
    ...(trimmedThumb ? { image: trimmedThumb } : {}),
    ...(input.icon ? { icon: input.icon } : {}),
  };
}

export function extractCreatedCategory(
  data: any,
): Record<string, any> | null {
  if (!data || typeof data !== "object") return null;
  const metadata = data.metadata ?? data.data ?? data.result ?? data;
  if (!metadata || typeof metadata !== "object") return null;
  if (metadata.category && typeof metadata.category === "object") {
    return metadata.category as Record<string, any>;
  }
  return metadata as Record<string, any>;
}

function isCategoryLikeObject(val: unknown): val is Record<string, any> {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false;
  const obj = val as Record<string, any>;
  return Boolean(
    obj.category_name ||
      obj.name ||
      obj.cat_name ||
      obj.category_slug ||
      obj.slug ||
      obj.category_id !== undefined ||
      obj._id !== undefined ||
      obj.id !== undefined,
  );
}

export function extractCategoryArray(data: any): Record<string, any>[] | null {
  if (!data) return null;
  if (Array.isArray(data)) return data;

  const candidateKeys = [
    "categories",
    "category",
    "tree",
    "children",
    "items",
    "list",
    "results",
    "docs",
    "rows",
    "data",
  ];

  const findArrayInContainer = (
    container: any,
    depth = 0,
  ): Record<string, any>[] | null => {
    if (!container || depth > 3) return null;
    if (Array.isArray(container)) return container;
    if (typeof container !== "object") return null;

    let fallbackEmptyArray: Record<string, any>[] | null = null;

    for (const key of candidateKeys) {
      const val = container[key];
      if (Array.isArray(val)) {
        if (val.length > 0) return val;
        if (!fallbackEmptyArray) fallbackEmptyArray = val;
      }
    }

    for (const [key, val] of Object.entries(container)) {
      if (key === "ancestors" || key === "category_ancestors") continue;
      if (Array.isArray(val)) {
        if (val.length > 0 && val.some((item) => isCategoryLikeObject(item))) {
          return val as Record<string, any>[];
        }
        if (!fallbackEmptyArray) {
          fallbackEmptyArray = val as Record<string, any>[];
        }
      }
    }

    for (const key of candidateKeys) {
      const val = container[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const nested = findArrayInContainer(val, depth + 1);
        if (nested && nested.length > 0) return nested;
        if (nested && !fallbackEmptyArray) fallbackEmptyArray = nested;
      }
    }

    if (isCategoryLikeObject(container)) {
      return [container];
    }

    return fallbackEmptyArray;
  };

  const metadata = data.metadata ?? data.data ?? data.result;
  if (metadata !== undefined) {
    const fromMetadata = findArrayInContainer(metadata, 0);
    if (fromMetadata) return fromMetadata;
  }

  return findArrayInContainer(data, 0);
}

function extractParentIdentifier(rawParent: unknown): string | null {
  if (rawParent === null || rawParent === undefined) return null;
  if (typeof rawParent === "object") {
    const obj = rawParent as Record<string, any>;
    const nestedId =
      obj._id ??
      obj.category_id ??
      obj.cat_id ??
      obj.id ??
      obj.category_slug ??
      obj.slug;
    return nestedId !== undefined && nestedId !== null
      ? String(nestedId).trim()
      : null;
  }
  const str = String(rawParent).trim();
  if (
    !str ||
    str === "0" ||
    str === "null" ||
    str === "undefined" ||
    str === "root" ||
    str === "000000000000000000000000"
  ) {
    return null;
  }
  return str;
}

function extractRawChildArray(
  raw: Record<string, any>,
): Record<string, any>[] | null {
  const explicitKeys = [
    "children",
    "category_children",
    "category_child",
    "category_childs",
    "childs",
    "categories",
    "subCategories",
    "sub_categories",
    "subcategories",
    "child",
    "items",
    "nodes",
  ];

  for (const key of explicitKeys) {
    if (Array.isArray(raw[key]) && raw[key].length > 0) {
      const valid = raw[key].filter((item: unknown) =>
        isCategoryLikeObject(item),
      );
      if (valid.length > 0) return valid;
    }
  }

  for (const [key, val] of Object.entries(raw)) {
    if (
      key === "ancestors" ||
      key === "category_ancestors" ||
      explicitKeys.includes(key)
    ) {
      continue;
    }
    if (Array.isArray(val) && val.length > 0) {
      const valid = val.filter((item: unknown) => isCategoryLikeObject(item));
      if (valid.length > 0) return valid;
    }
  }

  return null;
}

export function mapRawToCategory(
  raw: Record<string, any>,
  idx = 0,
  fallbackParentId: string | null = null,
  pathPrefix = "",
): ProductCategory {
  const pathKey = pathPrefix ? `${pathPrefix}-${idx}` : String(idx);
  const name = String(
    raw.category_name ||
      raw.cat_name ||
      raw.name ||
      raw.label ||
      raw.title ||
      `Danh mục #${idx + 1}`,
  );
  const slug = String(
    raw.category_slug ||
      raw.cat_slug ||
      raw.slug ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
  );

  const rawId =
    raw._id ??
    raw.category_id ??
    raw.cat_id ??
    raw.id ??
    raw.value ??
    (raw.category_slug || raw.slug ? `${slug}-${pathKey}` : null);

  const id =
    rawId !== null && rawId !== undefined && String(rawId).trim() !== ""
      ? String(rawId).trim()
      : `cat-${pathKey}`;

  const categoryId =
    raw.category_id !== undefined && raw.category_id !== null
      ? raw.category_id
      : raw.cat_id !== undefined && raw.cat_id !== null
        ? raw.cat_id
        : undefined;

  const description = String(
    raw.category_description || raw.cat_description || raw.description || "",
  );
  const rawImage =
    raw.category_thumb ||
    raw.category_image ||
    raw.Category_thumb ||
    raw.cat_thumb ||
    raw.image ||
    raw.thumb ||
    raw.icon;
  const image =
    typeof rawImage === "string" &&
    (rawImage.startsWith("http://") ||
      rawImage.startsWith("https://") ||
      rawImage.startsWith("/"))
      ? rawImage
      : undefined;

  const rawParent =
    raw.parent_id ??
    raw.category_parentId ??
    raw.category_parent_id ??
    raw.cat_parent_id ??
    raw.parentId ??
    raw.parent ??
    fallbackParentId;

  const normalizedParentId = extractParentIdentifier(rawParent);

  const rawActive =
    raw.category_active ??
    raw.is_active ??
    raw.isActive ??
    raw.active ??
    (raw.isDraft === true
      ? false
      : raw.isPublished === true
        ? true
        : undefined);

  const categoryActive =
    typeof rawActive === "boolean"
      ? rawActive
      : typeof rawActive === "string"
        ? rawActive.toLowerCase() !== "false" && rawActive !== "0"
        : typeof rawActive === "number"
          ? rawActive !== 0
          : false;

  const rawLeft = raw.category_left ?? raw.left ?? raw.lft;
  const rawRight = raw.category_right ?? raw.right ?? raw.rgt;
  const left =
    typeof rawLeft === "number" && !Number.isNaN(rawLeft)
      ? rawLeft
      : typeof rawLeft === "string" && rawLeft.trim() !== "" && !Number.isNaN(Number(rawLeft))
        ? Number(rawLeft)
        : undefined;
  const right =
    typeof rawRight === "number" && !Number.isNaN(rawRight)
      ? rawRight
      : typeof rawRight === "string" && rawRight.trim() !== "" && !Number.isNaN(Number(rawRight))
        ? Number(rawRight)
        : undefined;

  const rawChildren = extractRawChildArray(raw);

  const children = rawChildren
    ? rawChildren.map((child, childIdx) =>
        mapRawToCategory(child, childIdx, id, pathKey),
      )
    : undefined;

  return {
    id,
    ...(categoryId !== undefined ? { categoryId } : {}),
    name,
    slug,
    description: description || undefined,
    icon: typeof raw.icon === "string" ? raw.icon : "Layers",
    image,
    productCount: Number(
      raw.productCount ?? raw.category_product_count ?? raw.count ?? 0,
    ),
    parentId: normalizedParentId,
    category_active: categoryActive,
    ...(left !== undefined ? { left } : {}),
    ...(right !== undefined ? { right } : {}),
    ...(children && children.length > 0 ? { children } : {}),
  };
}

export function mapRawCategoryList(
  rawList: Record<string, any>[],
): ProductCategory[] {
  const mappedRoots = rawList.map((item, idx) =>
    mapRawToCategory(item, idx, null, String(idx)),
  );
  const byId = new Map<string, ProductCategory>();

  const collectAll = (
    items: ProductCategory[],
    parentId: string | null = null,
  ) => {
    for (const item of items) {
      const effectiveParentId =
        item.parentId && item.parentId !== item.id
          ? item.parentId
          : parentId && parentId !== item.id
            ? parentId
            : null;
      const existing = byId.get(item.id);
      const merged: ProductCategory = {
        ...(existing || {}),
        ...item,
        parentId: effectiveParentId,
      };
      byId.set(item.id, merged);

      if (item.children && item.children.length > 0) {
        collectAll(item.children, item.id);
      }
    }
  };

  collectAll(mappedRoots, null);
  return Array.from(byId.values());
}

export function buildCategoryTree(
  categories: ProductCategory[],
): ProductCategory[] {
  const nodeMap = new Map<string, ProductCategory>();
  const aliasMap = new Map<string, string>();

  const registerNode = (
    cat: ProductCategory,
    fallbackParentId: string | null = null,
  ) => {
    const existing = nodeMap.get(cat.id);
    const candidateParent =
      cat.parentId ?? existing?.parentId ?? fallbackParentId ?? null;
    const parentId =
      candidateParent && candidateParent !== cat.id ? candidateParent : null;

    nodeMap.set(cat.id, {
      ...(existing || {}),
      ...cat,
      parentId,
      children: [],
    });

    aliasMap.set(String(cat.id), cat.id);
    if (cat.categoryId !== undefined && cat.categoryId !== null) {
      aliasMap.set(String(cat.categoryId), cat.id);
    }
    if (cat.slug) {
      aliasMap.set(cat.slug, cat.id);
    }

    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        registerNode(child, cat.id);
      }
    }
  };

  for (const cat of categories) {
    registerNode(cat, null);
  }

  const parentOf = new Map<string, string>();
  const wouldCreateCycle = (childId: string, targetParentId: string): boolean => {
    let cursor: string | undefined = targetParentId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === childId) return true;
      if (visited.has(cursor)) return true;
      visited.add(cursor);
      cursor = parentOf.get(cursor);
    }
    return false;
  };

  const attachChild = (parentId: string, childNode: ProductCategory): boolean => {
    if (parentId === childNode.id) return false;
    const parentNode = nodeMap.get(parentId);
    if (!parentNode) return false;
    if (wouldCreateCycle(childNode.id, parentId)) return false;

    if (!parentNode.children) {
      parentNode.children = [];
    }
    if (!parentNode.children.some((c) => c.id === childNode.id)) {
      parentNode.children.push(childNode);
    }
    parentOf.set(childNode.id, parentId);
    return true;
  };

  // Pass 1: Attach using explicit parentId / children relationship
  for (const node of nodeMap.values()) {
    const rawParentKey = node.parentId ? String(node.parentId) : null;
    const resolvedParentId = rawParentKey
      ? aliasMap.get(rawParentKey)
      : undefined;

    if (resolvedParentId && resolvedParentId !== node.id) {
      attachChild(resolvedParentId, node);
    }
  }

  // Pass 2: If nodes have Nested Set Model (category_left / category_right) and no parent attached yet
  const allNodes = Array.from(nodeMap.values());
  const nodesWithLeftRight = allNodes.filter(
    (n) =>
      typeof n.left === "number" &&
      typeof n.right === "number" &&
      n.right > n.left,
  );

  if (nodesWithLeftRight.length > 1) {
    for (const node of nodesWithLeftRight) {
      if (parentOf.has(node.id)) continue;

      let bestParent: ProductCategory | null = null;
      let bestSpan = Infinity;

      for (const candidate of nodesWithLeftRight) {
        if (candidate.id === node.id) continue;
        if (
          candidate.left! < node.left! &&
          candidate.right! > node.right!
        ) {
          const span = candidate.right! - candidate.left!;
          if (span < bestSpan) {
            bestSpan = span;
            bestParent = candidate;
          }
        }
      }

      if (bestParent) {
        attachChild(bestParent.id, node);
      }
    }
  }

  const roots: ProductCategory[] = [];
  for (const node of nodeMap.values()) {
    if (!parentOf.has(node.id)) {
      roots.push(node);
    }
  }

  // Safety fallback: if all nodes somehow had parents, return all nodes at root so nothing is hidden
  if (roots.length === 0 && nodeMap.size > 0) {
    return Array.from(nodeMap.values());
  }

  return roots;
}

export function flattenCategoryTreeWithDepth(
  categories: ProductCategory[],
): Array<{ category: ProductCategory; depth: number }> {
  const tree = buildCategoryTree(categories);
  const result: Array<{ category: ProductCategory; depth: number }> = [];

  const traverse = (nodes: ProductCategory[], depth: number) => {
    for (const node of nodes) {
      result.push({ category: node, depth });
      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    }
  };

  traverse(tree, 0);
  return result;
}
