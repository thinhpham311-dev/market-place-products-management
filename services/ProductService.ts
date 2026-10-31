import ApiService from "./ApiService";
import {
  Product,
  ProductStatus,
  SpuProductAttributes,
  SpuSkuItem,
  SpuVariationGroup,
} from "@/types/product";
import { safeExtractString, extractIdString } from "./CategoryService";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
} from "@/constants/api/api.constant";

export const NEXT_DRAFTED_SPU_LIST_ENDPOINT = "/api/product/spu/drafted/list";
export const NEXT_PUBLISHED_SPU_LIST_ENDPOINT = "/api/product/spu/published/list";
export const NEXT_CREATE_SPU_ENDPOINT = "/api/product/spu/create";
export const NEXT_UPDATE_SPU_ENDPOINT = "/api/product/spu/update";
export const NEXT_PUBLISH_SPU_ENDPOINT = "/api/product/spu/publish";
export const NEXT_UNPUBLISH_SPU_ENDPOINT = "/api/product/spu/unpublish";

export const DEFAULT_SPU_VARIATION_IMAGE =
  "https://res.cloudinary.com/dgincjt1i/image/upload/v1751873400/Image-not-found_qxnjwm.png";

export interface CreateSpuPayload {
  product_name: string;
  product_thumb: string;
  product_description: string;
  product_price: number;
  product_brand: string;
  product_category: string[];
  product_attributes: SpuProductAttributes;
  product_variations: SpuVariationGroup[];
  sku_list: SpuSkuItem[];
}

export const EXAMPLE_CREATE_SPU_PAYLOAD: CreateSpuPayload = {
  product_name: "New Jeans Notification 2",
  product_thumb: "product_thumb",
  product_description:
    "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean auctor tristique tortor, vel tincidunt nunc cursus vel. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Quisque facilisis mauris sapien. Sed non urna et lorem sodales imperdiet id vel sem. Curabitur metus dui, congue ac tellus sed, pharetra vulputate lectus. Curabitur tempus elit lectus, ut feugiat elit varius vel. Mauris aliquam justo dolor, a consequat tortor facilisis vitae. Nulla cursus id leo vitae suscipit. Pellentesque luctus vestibulum elementum.</p> <p>Donec vitae tortor turpis. In bibendum urna ac sem consequat gravida. Donec non arcu sed ante efficitur lobortis sit amet et massa. Sed id massa sapien. Quisque porta commodo nisl at tempor. Morbi vel dui pellentesque, sagittis purus eget, aliquet odio. Mauris aliquet augue laoreet mattis aliquam. Proin scelerisque, lorem elementum feugiat bibendum, ante sapien lacinia magna, non porta mauris diam auctor ante. Mauris consequat ipsum vitae ligula pharetra, id tincidunt lorem porta. Vestibulum vehicula dolor vitae viverra semper. Interdum et malesuada fames ac ante ipsum primis in faucibus. Duis ac vulputate nisl, eleifend finibus felis.</p> <p>Proin eu euismod nisl. Sed iaculis, nibh ut auctor luctus, justo nisi iaculis sapien, id lacinia metus nisl eget massa. Suspendisse euismod pharetra placerat. Nullam non dui auctor, ornare nibh id, aliquet enim. Donec facilisis congue sapien eget consectetur. Aliquam urna arcu, porttitor at mauris sit amet, semper interdum lacus. Phasellus rutrum eget metus semper venenatis. In tortor risus, interdum at tincidunt non, volutpat in metus. Cras dapibus vel ligula eget blandit. Vestibulum eleifend diam at aliquet volutpat. Praesent eu velit enim. Suspendisse pharetra sollicitudin nisi ut tincidunt.</p> <p> Ut volutpat turpis a posuere maximus. Morbi sit amet massa sed ante tristique viverra. Phasellus turpis enim, pellentesque in augue quis, pulvinar tristique nulla. Pellentesque quis interdum lorem. Etiam quis nunc vitae nulla varius molestie. Fusce tincidunt efficitur sollicitudin. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><p>Vestibulum dapibus, nisl et tincidunt ornare, sapien nibh sodales diam, a eleifend nibh ante sit amet nisl. Vivamus at nibh vel tellus luctus dictum. Morbi eu nulla in mauris mollis gravida. Suspendisse tempus non ligula ac pharetra. Sed pretium purus vitae mauris congue feugiat. Aenean gravida varius dui, quis volutpat mauris varius eget. Cras quis eros sed nisl convallis consequat. Morbi quis urna pretium, feugiat ligula vitae, pellentesque leo. Etiam ornare libero lacus, non aliquam orci pulvinar sit amet. Cras ut purus aliquam, sollicitudin dolor non, ultricies massa. In posuere erat ipsum, non ultrices metus egestas ac. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras metus elit, efficitur quis aliquet quis, imperdiet vitae est. Cras elementum mauris vel ante fermentum dictum.</p>",
  product_price: 50,
  product_brand: "131820",
  product_category: [],
  product_attributes: {
    attribute_id: 200000,
    attribute_value: [{ value_id: 1 }, { value_id: 2 }],
  },
  product_variations: [
    {
      label: "color",
      value: [
        {
          label: "Red",
          value: "red",
          image: DEFAULT_SPU_VARIATION_IMAGE,
        },
        {
          label: "Green",
          value: "green",
          image: DEFAULT_SPU_VARIATION_IMAGE,
        },
      ],
    },
    {
      label: "size",
      value: [
        {
          label: "S",
          value: "s",
          image: DEFAULT_SPU_VARIATION_IMAGE,
        },
        {
          label: "M",
          value: "m",
          image: DEFAULT_SPU_VARIATION_IMAGE,
        },
      ],
    },
    {
      label: "material",
      value: [
        {
          label: "Wood",
          value: "wood",
          image: DEFAULT_SPU_VARIATION_IMAGE,
        },
        {
          label: "Inox 304",
          value: "inox-304",
          image: DEFAULT_SPU_VARIATION_IMAGE,
        },
      ],
    },
  ],
  sku_list: [
    { sku_tier_idx: [0, 0, 0], sku_price: 55, sku_stock: 10 },
    { sku_tier_idx: [0, 0, 1], sku_price: 56, sku_stock: 10 },
    { sku_tier_idx: [0, 1, 0], sku_price: 57, sku_stock: 10 },
    { sku_tier_idx: [0, 1, 1], sku_price: 58, sku_stock: 10 },
    { sku_tier_idx: [1, 0, 0], sku_price: 59, sku_stock: 10 },
    { sku_tier_idx: [1, 0, 1], sku_price: 60, sku_stock: 10 },
    { sku_tier_idx: [1, 1, 0], sku_price: 61, sku_stock: 10 },
    { sku_tier_idx: [1, 1, 1], sku_price: 62, sku_stock: 10 },
  ],
};

export function generateCartesianSkuList(
  variations: SpuVariationGroup[],
  defaultPrice = 50,
  defaultStock = 10,
  existingSkuList?: SpuSkuItem[],
): SpuSkuItem[] {
  const validGroups = variations.filter(
    (g) => g.label.trim() && Array.isArray(g.value) && g.value.length > 0,
  );
  if (validGroups.length === 0) {
    return [];
  }

  const existingMap = new Map<string, SpuSkuItem>();
  if (Array.isArray(existingSkuList)) {
    existingSkuList.forEach((item) => {
      if (Array.isArray(item.sku_tier_idx)) {
        existingMap.set(item.sku_tier_idx.join(","), item);
      }
    });
  }

  const combinations: number[][] = [];
  const helper = (groupIndex: number, currentIndices: number[]) => {
    if (groupIndex === validGroups.length) {
      combinations.push(currentIndices);
      return;
    }
    const groupOptions = validGroups[groupIndex].value;
    for (let i = 0; i < groupOptions.length; i++) {
      helper(groupIndex + 1, [...currentIndices, i]);
    }
  };
  helper(0, []);

  return combinations.map((tierIdx) => {
    const key = tierIdx.join(",");
    const existing = existingMap.get(key);
    return {
      sku_tier_idx: tierIdx,
      sku_price: existing ? Number(existing.sku_price) : Number(defaultPrice) || 0,
      sku_stock: existing ? Number(existing.sku_stock) : Number(defaultStock) || 0,
    };
  });
}

export function buildCreateSpuPayload(product: Partial<Product>): CreateSpuPayload {
  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 10;

  const product_variations: SpuVariationGroup[] =
    Array.isArray(product.product_variations) && product.product_variations.length > 0
      ? product.product_variations.map((g) => ({
          label: safeExtractString(g.label, "Tier"),
          value: Array.isArray(g.value)
            ? g.value.map((opt) => ({
                label: safeExtractString(opt.label, ""),
                value: safeExtractString(opt.value, ""),
                image: safeExtractString(opt.image, DEFAULT_SPU_VARIATION_IMAGE),
              }))
            : [],
        }))
      : EXAMPLE_CREATE_SPU_PAYLOAD.product_variations;

  const sku_list: SpuSkuItem[] =
    Array.isArray(product.sku_list) && product.sku_list.length > 0
      ? product.sku_list.map((item) => ({
          sku_tier_idx: Array.isArray(item.sku_tier_idx)
            ? item.sku_tier_idx.map((n) => Number(n) || 0)
            : [0],
          sku_price: Number(item.sku_price) || 0,
          sku_stock: Number(item.sku_stock) || 0,
        }))
      : generateCartesianSkuList(product_variations, price || 50, stock || 10);

  let product_attributes: SpuProductAttributes = {
    attribute_id: 200000,
    attribute_value: [],
    items: [],
  };

  if (product.product_attributes) {
    if (
      typeof product.product_attributes.attribute_id === "number" &&
      Array.isArray(product.product_attributes.attribute_value)
    ) {
      product_attributes = {
        attribute_id: Number(product.product_attributes.attribute_id),
        attribute_value: product.product_attributes.attribute_value.map((v) => ({
          value_id: Number(v.value_id),
          ...(v.name ? { name: safeExtractString(v.name, "") } : {}),
        })),
        ...(product.product_attributes.name
          ? { name: safeExtractString(product.product_attributes.name, "") }
          : {}),
        ...(Array.isArray(product.product_attributes.items)
          ? { items: product.product_attributes.items }
          : {}),
      };
    } else if (
      Array.isArray(product.product_attributes.items)
    ) {
      if (product.product_attributes.items.length > 0) {
        const first = product.product_attributes.items[0];
        product_attributes = {
          attribute_id: Number(first.attribute_id) || 200000,
          ...(first.name ? { name: safeExtractString(first.name, "") } : {}),
          attribute_value: Array.isArray(first.attribute_value)
            ? first.attribute_value.map((v) => ({
                value_id: Number(v.value_id),
                ...(v.name ? { name: safeExtractString(v.name, "") } : {}),
              }))
            : [],
          items: product.product_attributes.items,
        };
      } else {
        product_attributes = {
          attribute_id: 200000,
          attribute_value: [],
          items: [],
        };
      }
    }
  }

  const rawCatList = Array.isArray(product.product_category)
    ? product.product_category
    : product.categoryId
      ? [product.categoryId]
      : [];
  const product_category: string[] = rawCatList
    .map((item) => {
      if (item === null || item === undefined) return "";
      if (typeof item === "object") {
        return (
          extractIdString(item) ||
          safeExtractString((item as any).name || (item as any).category_name, "")
        );
      }
      const s = String(item).trim();
      return s === "[object Object]" ? "" : s;
    })
    .filter((s): s is string => Boolean(s && s !== "[object Object]"));

  const product_name =
    safeExtractString(product.name, "Sản phẩm SPU mới").trim() ||
    "Sản phẩm SPU mới";
  const product_thumb =
    safeExtractString(product.thumbnail, "product_thumb").trim() ||
    "product_thumb";
  const product_description = (
    safeExtractString(
      product.description || product.shortDescription,
      "",
    ) || `<p>${product_name}</p>`
  ).trim();

  const rawBrand = product.product_brand ?? product.brand ?? "131820";
  const product_brand = (
    typeof rawBrand === "object" && rawBrand !== null
      ? safeExtractString(
          (rawBrand as any).name ||
            (rawBrand as any)._id ||
            (rawBrand as any).id ||
            (rawBrand as any).brand_name,
          "131820",
        )
      : safeExtractString(rawBrand, "131820")
  ).trim() || "131820";

  return {
    product_name,
    product_thumb,
    product_description,
    product_price: price,
    product_brand,
    product_category,
    product_attributes,
    product_variations,
    sku_list,
  };
}

export async function apiCreateSpu(
  payload: CreateSpuPayload | Record<string, unknown>,
) {
  return ApiService.fetchData<Record<string, any>>({
    url: "/product/spu/create",
    method: "post",
    data: payload,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export function extractCreatedSpu(data: any): Record<string, any> | null {
  if (!data || typeof data !== "object") return null;
  const metadata = data.metadata ?? data.data ?? data.result ?? data;
  if (!metadata || typeof metadata !== "object") return null;

  if (metadata.spu && typeof metadata.spu === "object") {
    return metadata.spu as Record<string, any>;
  }
  if (metadata.product && typeof metadata.product === "object") {
    return metadata.product as Record<string, any>;
  }
  if (metadata._id || metadata.product_id || metadata.product_name || metadata.spu_id) {
    return metadata as Record<string, any>;
  }
  return null;
}

export function buildUpdateSpuPayload(
  product: Partial<Product> & Record<string, any>,
): Record<string, unknown> {
  const basePayload = buildCreateSpuPayload(product);

  const primaryId = safeExtractString(
    product.product_id || product.spu_id || product.id || product._id,
    "",
  ).trim();

  return {
    ...basePayload,
    ...(primaryId
      ? {
          product_id: primaryId,
          spu_id: primaryId,
          _id: primaryId,
        }
      : {}),
    ...(product.fallback_id ? { fallback_id: product.fallback_id } : {}),
  };
}

export async function apiUpdateSpu(
  productOrId: Product | string,
  payload?: Partial<Product> | Record<string, unknown>,
) {
  const isProductObj = typeof productOrId === "object" && productOrId !== null;
  const primaryId = isProductObj
    ? String(
        productOrId.product_id ||
          productOrId.id ||
          productOrId.spu_id ||
          productOrId.sku ||
          "",
      ).trim()
    : String(productOrId || "").trim();

  const fallbackId = isProductObj
    ? String(
        productOrId.spu_id ||
          productOrId.id ||
          productOrId.product_id ||
          (productOrId.sku && !productOrId.sku.startsWith("SPU-")
            ? productOrId.sku
            : "") ||
          "",
      ).trim()
    : undefined;

  const dataPayload =
    payload && "product_name" in payload
      ? payload
      : payload
        ? buildUpdateSpuPayload(payload as Partial<Product>)
        : {};

  return ApiService.fetchData<Record<string, any>>({
    url: `/product/spu/update/${encodeURIComponent(primaryId)}`,
    method: "patch",
    data: {
      product_id: primaryId,
      ...(fallbackId && fallbackId !== primaryId
        ? { fallback_id: fallbackId, spu_id: fallbackId, _id: fallbackId }
        : {}),
      ...(dataPayload || {}),
    },
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export function extractUpdatedSpu(data: any): Record<string, any> | null {
  return extractCreatedSpu(data);
}

export function isProductPublished(product: Product): boolean {
  return (
    product.status === "active" ||
    Boolean(product.publishedAt) ||
    Boolean(product.tags?.includes("published")) ||
    product.status !== "draft"
  );
}

export async function apiPublishSpu(
  productOrId: Product | string,
  payload?: Record<string, unknown>,
) {
  const isProductObj = typeof productOrId === "object" && productOrId !== null;
  const primaryId = isProductObj
    ? String(
        productOrId.product_id ||
          productOrId.id ||
          productOrId.spu_id ||
          productOrId.sku ||
          "",
      ).trim()
    : String(productOrId || "").trim();

  const fallbackId = isProductObj
    ? String(
        productOrId.spu_id ||
          productOrId.id ||
          productOrId.product_id ||
          (productOrId.sku && !productOrId.sku.startsWith("SPU-")
            ? productOrId.sku
            : "") ||
          "",
      ).trim()
    : undefined;

  return ApiService.fetchData<Record<string, any>>({
    url: `/product/spu/publish/${encodeURIComponent(primaryId)}`,
    method: "post",
    data: {
      product_id: primaryId,
      ...(fallbackId && fallbackId !== primaryId
        ? { fallback_id: fallbackId, spu_id: fallbackId, _id: fallbackId }
        : {}),
      ...(payload || {}),
    },
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiUnpublishSpu(
  productOrId: Product | string,
  payload?: Record<string, unknown>,
) {
  const isProductObj = typeof productOrId === "object" && productOrId !== null;
  const primaryId = isProductObj
    ? String(
        productOrId.product_id ||
          productOrId.id ||
          productOrId.spu_id ||
          productOrId.sku ||
          "",
      ).trim()
    : String(productOrId || "").trim();

  const fallbackId = isProductObj
    ? String(
        productOrId.spu_id ||
          productOrId.id ||
          productOrId.product_id ||
          (productOrId.sku && !productOrId.sku.startsWith("SPU-")
            ? productOrId.sku
            : "") ||
          "",
      ).trim()
    : undefined;

  return ApiService.fetchData<Record<string, any>>({
    url: `/product/spu/unpublish/${encodeURIComponent(primaryId)}`,
    method: "post",
    data: {
      product_id: primaryId,
      ...(fallbackId && fallbackId !== primaryId
        ? { fallback_id: fallbackId, spu_id: fallbackId, _id: fallbackId }
        : {}),
      ...(payload || {}),
    },
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiGetDraftedSpuList(params?: Record<string, unknown>) {
  return ApiService.fetchData<Record<string, any>>({
    url: "/product/spu/drafted/list",
    method: "get",
    params,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiGetPublishedSpuList(params?: Record<string, unknown>) {
  return ApiService.fetchData<Record<string, any>>({
    url: "/product/spu/published/list",
    method: "get",
    params,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export function extractSpuArray(data: any): Record<string, any>[] | null {
  if (!data) return null;
  if (Array.isArray(data)) return data;

  const metadata = data.metadata ?? data.data ?? data.result;
  if (Array.isArray(metadata)) return metadata;

  if (metadata && typeof metadata === "object") {
    const candidateKeys = [
      "spus",
      "products",
      "items",
      "list",
      "results",
      "docs",
      "data",
      "drafts",
      "published",
    ];
    for (const key of candidateKeys) {
      if (Array.isArray(metadata[key])) {
        return metadata[key];
      }
    }
    for (const val of Object.values(metadata)) {
      if (Array.isArray(val)) {
        return val as Record<string, any>[];
      }
    }
  }

  return null;
}

const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80";

function resolveThumbnail(rawThumb: unknown): string {
  if (typeof rawThumb === "string" && rawThumb.trim()) {
    const trimmed = rawThumb.trim();
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("data:image/")
    ) {
      return trimmed;
    }
  }
  return DEFAULT_THUMB;
}

export function mapSpuToProduct(
  spu: Record<string, any>,
  idx = 0,
  defaultStatus: ProductStatus = "draft",
): Product {
  const rawProductId =
    spu.product_id !== undefined &&
    spu.product_id !== null &&
    String(spu.product_id).trim() !== ""
      ? String(spu.product_id).trim()
      : spu.spu_id !== undefined &&
          spu.spu_id !== null &&
          String(spu.spu_id).trim() !== ""
        ? String(spu.spu_id).trim()
        : undefined;
  const rawMongoId =
    spu._id !== undefined && spu._id !== null && String(spu._id).trim() !== ""
      ? String(spu._id).trim()
      : undefined;

  const id = String(
    rawProductId || rawMongoId || spu.id || `spu-${Date.now()}-${idx}`,
  );
  const resolvedStatus: ProductStatus =
    spu.isPublished === true
      ? "active"
      : spu.isDraft === true
        ? "draft"
        : defaultStatus;
  const name = String(
    spu.product_name ||
      spu.spu_name ||
      spu.name ||
      spu.title ||
      (resolvedStatus === "active" ? "Sản phẩm đang bán" : "Sản phẩm nháp"),
  );
  const slug = String(
    spu.product_slug ||
      spu.spu_slug ||
      spu.slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
  );
  const price = Number(spu.product_price ?? spu.spu_price ?? spu.price ?? 0);
  const stock = Number(
    spu.product_quantity ?? spu.spu_quantity ?? spu.quantity ?? spu.stock ?? 0,
  );

  const rawThumbCandidate =
    spu.product_thumb ||
    spu.spu_thumb ||
    spu.thumb ||
    spu.thumbnail ||
    (Array.isArray(spu.product_images) ? spu.product_images[0] : undefined) ||
    (Array.isArray(spu.images) ? spu.images[0] : undefined);
  const thumb = resolveThumbnail(rawThumbCandidate);

  const rawCategoryCandidate =
    spu.product_category ||
    spu.spu_category ||
    spu.product_type ||
    spu.category ||
    "Chưa phân loại";

  let categoryName = "Chưa phân loại";
  if (Array.isArray(rawCategoryCandidate) && rawCategoryCandidate.length > 0) {
    const first = rawCategoryCandidate[0];
    if (typeof first === "object" && first !== null) {
      categoryName = safeExtractString(
        first.name || first.category_name || first.title || first.label || first._id,
        "Chưa phân loại",
      );
    } else {
      categoryName = safeExtractString(first, "Chưa phân loại");
    }
  } else if (typeof rawCategoryCandidate === "object" && rawCategoryCandidate !== null) {
    categoryName = safeExtractString(
      rawCategoryCandidate.name ||
        rawCategoryCandidate.category_name ||
        rawCategoryCandidate.title ||
        rawCategoryCandidate.label ||
        rawCategoryCandidate._id,
      "Chưa phân loại",
    );
  } else {
    categoryName = safeExtractString(rawCategoryCandidate, "Chưa phân loại");
  }
  if (!categoryName || categoryName === "[object Object]") {
    categoryName = "Chưa phân loại";
  }

  const rawCategoryId = spu.categoryId ?? spu.category_id;
  const extractedCategoryId = extractIdString(rawCategoryId);
  const categoryId =
    extractedCategoryId ||
    extractIdString(rawCategoryCandidate) ||
    categoryName;

  const rawCatArray = Array.isArray(spu.product_category)
    ? spu.product_category
    : Array.isArray(rawCategoryCandidate)
      ? rawCategoryCandidate
      : [categoryName];
  const sanitizedProductCategory: string[] = rawCatArray
    .map((item: any) => {
      if (item === null || item === undefined) return "";
      if (typeof item === "object") {
        return (
          extractIdString(item) ||
          safeExtractString(item.name || item.category_name || item.title, "")
        );
      }
      const str = String(item).trim();
      return str === "[object Object]" ? "" : str;
    })
    .filter((s): s is string => Boolean(s && s !== "[object Object]"));

  const rawVariations = spu.product_variations || spu.spu_variations || [];
  const rawAttributes = spu.product_attributes || spu.spu_attributes || {};

  const rawBrand =
    spu.product_brand ||
    rawAttributes?.brand ||
    rawAttributes?.manufacturer ||
    spu.brand ||
    "NovaShop";
  const brandName =
    typeof rawBrand === "object" && rawBrand !== null
      ? safeExtractString(
          rawBrand.name || rawBrand.brand_name || rawBrand.title || rawBrand._id,
          "NovaShop",
        )
      : safeExtractString(rawBrand, "NovaShop");

  const createdAt = spu.createdAt
    ? String(spu.createdAt).split("T")[0]
    : new Date().toISOString().split("T")[0];
  const updatedAt = spu.updatedAt
    ? String(spu.updatedAt).split("T")[0]
    : createdAt;

  return {
    id,
    product_id: rawProductId || rawMongoId || id,
    spu_id: rawMongoId || rawProductId || id,
    sku: String(
      rawProductId ||
        spu.sku ||
        `SPU-${id.slice(-6).toUpperCase()}`,
    ),
    name: safeExtractString(name, `Sản phẩm #${idx + 1}`),
    slug: safeExtractString(slug, id),
    description: safeExtractString(
      spu.product_description || spu.spu_description || spu.description || "",
      "",
    ),
    shortDescription: safeExtractString(
      spu.product_description ||
        spu.spu_description ||
        spu.shortDescription ||
        "",
      "",
    ),
    category: categoryName,
    categoryId: String(categoryId || categoryName),
    brand: brandName,
    product_brand: brandName,
    product_category: sanitizedProductCategory,
    tags: Array.isArray(spu.tags)
      ? spu.tags
      : resolvedStatus === "active"
        ? ["published", "spu"]
        : ["draft", "spu"],
    price,
    originalPrice: Number(spu.originalPrice ?? price),
    costPrice: Number(spu.costPrice ?? Math.round(price * 0.7)),
    stock,
    lowStockThreshold: Number(spu.lowStockThreshold ?? 10),
    thumbnail: thumb,
    images:
      Array.isArray(spu.images) && spu.images.length > 0
        ? spu.images.map(resolveThumbnail)
        : [thumb],
    status: resolvedStatus,
    soldCount: Number(spu.product_sold ?? spu.soldCount ?? 0),
    rating: Number(
      spu.product_ratingsAverage ?? spu.spu_ratingsAverage ?? spu.rating ?? 4.5,
    ),
    reviewCount: Number(spu.reviewCount ?? 0),
    revenue: Number(
      spu.revenue ?? Number(spu.product_sold ?? spu.soldCount ?? 0) * price,
    ),
    hasVariants: Array.isArray(rawVariations) && rawVariations.length > 0,
    variantAttributes: Array.isArray(rawVariations)
      ? rawVariations.map((v: any) => ({
          name: String(v.label || v.name || "Phân loại"),
          values: Array.isArray(v.value)
            ? v.value.map((opt: any) =>
                typeof opt === "object" && opt !== null
                  ? String(opt.label || opt.value || "")
                  : String(opt),
              )
            : Array.isArray(v.options)
              ? v.options.map(String)
              : Array.isArray(v.values)
                ? v.values.map(String)
                : [],
        }))
      : undefined,
    channels: Array.isArray(spu.channels) ? spu.channels : ["website"],
    product_attributes: rawAttributes,
    product_variations: Array.isArray(rawVariations) ? rawVariations : undefined,
    createdAt,
    updatedAt,
  };
}
