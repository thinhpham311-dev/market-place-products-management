import { SupportedLanguage } from '@/store/settings/languageSlice';

const CATEGORY_NAME_MAP: Record<string, Record<SupportedLanguage, string>> = {
  'Thời trang Nam & Nữ': {
    vi: 'Thời trang Nam & Nữ',
    en: 'Men & Women Fashion',
    ja: 'メンズ・レディースファッション',
  },
  'Thiết bị Điện tử': {
    vi: 'Thiết bị Điện tử',
    en: 'Consumer Electronics',
    ja: 'デジタル・電子機器',
  },
  'Mỹ phẩm & Chăm sóc da': {
    vi: 'Mỹ phẩm & Chăm sóc da',
    en: 'Beauty & Skincare',
    ja: 'コスメ・スキンケア',
  },
  'Nhà cửa & Đời sống': {
    vi: 'Nhà cửa & Đời sống',
    en: 'Home & Living',
    ja: 'ホーム＆リビング',
  },
  'Phụ kiện & Đồng hồ': {
    vi: 'Phụ kiện & Đồng hồ',
    en: 'Watches & Accessories',
    ja: '時計・アクセサリー',
  },
};

const CATEGORY_DESC_MAP: Record<string, Record<SupportedLanguage, string>> = {
  'Quần áo, phụ kiện, giày dép thời trang': {
    vi: 'Quần áo, phụ kiện, giày dép thời trang',
    en: 'Apparel, fashion accessories, and footwear',
    ja: 'アパレル、ファッション小物、シューズ',
  },
  'Điện thoại, tai nghe, phụ kiện công nghệ': {
    vi: 'Điện thoại, tai nghe, phụ kiện công nghệ',
    en: 'Smartphones, headphones, and tech gadgets',
    ja: 'スマートフォン、ヘッドホン、テック周辺機器',
  },
  'Serum, kem dưỡng, đồ trang điểm chính hãng': {
    vi: 'Serum, kem dưỡng, đồ trang điểm chính hãng',
    en: 'Authentic serums, moisturizers, and makeup',
    ja: '正規品セラム、保湿クリーム、メイクアップ用品',
  },
  'Đồ gia dụng thông minh, trang trí nội thất': {
    vi: 'Đồ gia dụng thông minh, trang trí nội thất',
    en: 'Smart home appliances and interior decor',
    ja: 'スマート家電、インテリア雑貨',
  },
  'Kính mắt, đồng hồ nam nữ, túi xách cao cấp': {
    vi: 'Kính mắt, đồng hồ nam nữ, túi xách cao cấp',
    en: 'Eyewear, luxury watches, and premium handbags',
    ja: 'アイウェア、腕時計、プレミアムバッグ',
  },
};

const PRODUCT_NAME_MAP: Record<string, Record<SupportedLanguage, string>> = {
  'Áo Thun Oversize Cotton 100% Unisex Cao Cấp': {
    vi: 'Áo Thun Oversize Cotton 100% Unisex Cao Cấp',
    en: 'Premium 100% Cotton Oversize Unisex T-Shirt',
    ja: 'プレミアム 100%コットン オーバーサイズ ユニセックス Tシャツ',
  },
  'Tai Nghe Bluetooth Không Dây Chống Ồn ANC Pro X': {
    vi: 'Tai Nghe Bluetooth Không Dây Chống Ồn ANC Pro X',
    en: 'ANC Pro X Wireless Noise-Cancelling Headphones',
    ja: 'ANC Pro X ワイヤレス ノイズキャンセリング ヘッドホン',
  },
  'Serum Phục Hồi Dưỡng Sáng Da Niacinamide 10% + Zinc 1%': {
    vi: 'Serum Phục Hồi Dưỡng Sáng Da Niacinamide 10% + Zinc 1%',
    en: 'Niacinamide 10% + Zinc 1% Brightening Recovery Serum',
    ja: 'ナイアシンアミド10% + 亜鉛1% ブライトニング美容液',
  },
  'Bàn Phím Cơ Không Dây 3 Chế Độ Gasket Mount RGB': {
    vi: 'Bàn Phím Cơ Không Dây 3 Chế Độ Gasket Mount RGB',
    en: 'Tri-Mode Wireless Gasket Mount RGB Mechanical Keyboard',
    ja: '3モード対応 ワイヤレス ガスケットマウント RGB メカニカルキーボード',
  },
  'Đèn Bàn LED Chống Cận Cảm Ứng Đổi 5 Chế Độ Ánh Sáng': {
    vi: 'Đèn Bàn LED Chống Cận Cảm Ứng Đổi 5 Chế Độ Ánh Sáng',
    en: '5-Mode Touch Control Eye-Care LED Desk Lamp',
    ja: '5段階調光 タッチ式 アイケア LEDデスクライト',
  },
  'Đồng Hồ Nam Dây Da Cao Cấp Classic Sapphire 40mm': {
    vi: 'Đồng Hồ Nam Dây Da Cao Cấp Classic Sapphire 40mm',
    en: 'Classic Sapphire 40mm Premium Leather Mens Watch',
    ja: 'クラシック サファイア 40mm 本革ベルト メンズ腕時計',
  },
  'Đầm Nữ Voan Tơ Hoa Nhí Cổ Vuông Tay Phồng Dáng Xòe': {
    vi: 'Đầm Nữ Voan Tơ Hoa Nhí Cổ Vuông Tay Phồng Dáng Xòe',
    en: 'Floral Chiffon Square-Neck Puff-Sleeve Midi Dress',
    ja: '花柄シフォン スクエアネック パフスリーブ フレアワンピース',
  },
  'Bình Giữ Nhiệt Inox 316 Cao Cấp 800ml Kèm Ống Hút': {
    vi: 'Bình Giữ Nhiệt Inox 316 Cao Cấp 800ml Kèm Ống Hút',
    en: '800ml 316 Stainless Steel Insulated Tumbler with Straw',
    ja: 'SUS316 真空断熱 保温保冷タンブラー 800ml ストロー付き',
  },
};

const LOG_REASON_MAP: Record<string, Record<SupportedLanguage, string>> = {
  'Nhập lô hàng mới từ xưởng may': {
    vi: 'Nhập lô hàng mới từ xưởng may',
    en: 'Received new batch from garment factory',
    ja: '縫製工場から新規ロット入庫',
  },
  'Xuất đơn sỉ đại lý TP.HCM': {
    vi: 'Xuất đơn sỉ đại lý TP.HCM',
    en: 'Wholesale dispatch to HCMC distributor',
    ja: 'ホーチミン代理店向け卸売出庫',
  },
  'Kiểm kê phát hiện lỗi đóng gói': {
    vi: 'Kiểm kê phát hiện lỗi đóng gói',
    en: 'Stocktake adjustment: packaging defect found',
    ja: '棚卸調整：梱包不良による減数',
  },
  'Nhập hàng chính ngạch từ Hàn Quốc': {
    vi: 'Nhập hàng chính ngạch từ Hàn Quốc',
    en: 'Official import shipment from South Korea',
    ja: '韓国からの正規輸入ロット入庫',
  },
};

export function translateCategoryName(name: unknown, lang: SupportedLanguage = 'vi'): string {
  if (name === null || name === undefined) return '';
  if (typeof name === 'object') {
    const obj = name as Record<string, any>;
    const direct = obj[lang] || obj.vi || obj.name || obj.category_name || obj.title;
    if (direct && typeof direct === 'string' && direct !== '[object Object]') {
      return direct;
    }
  }
  const str = String(name).trim();
  if (!str || str === '[object Object]') return '';
  return CATEGORY_NAME_MAP[str]?.[lang] ?? str;
}

export function translateCategoryDesc(desc: unknown, lang: SupportedLanguage = 'vi'): string {
  if (desc === null || desc === undefined) return '';
  if (typeof desc === 'object') {
    const obj = desc as Record<string, any>;
    const direct = obj[lang] || obj.vi || obj.description || obj.category_description;
    if (direct && typeof direct === 'string' && direct !== '[object Object]') {
      return direct;
    }
  }
  const str = String(desc).trim();
  if (!str || str === '[object Object]') return '';
  return CATEGORY_DESC_MAP[str]?.[lang] ?? desc;
}

export function translateProductName(name: unknown, lang: SupportedLanguage = 'vi'): string {
  if (name === null || name === undefined) return '';
  if (typeof name === 'object') {
    const obj = name as Record<string, any>;
    const direct = obj[lang] || obj.vi || obj.name || obj.product_name || obj.title;
    if (direct && typeof direct === 'string' && direct !== '[object Object]') {
      return direct;
    }
  }
  const str = String(name).trim();
  if (!str || str === '[object Object]') return '';
  return PRODUCT_NAME_MAP[str]?.[lang] ?? str;
}

export function translateLogReason(reason: unknown, lang: SupportedLanguage = 'vi'): string {
  if (reason === null || reason === undefined) return '';
  const str = String(reason).trim();
  if (!str || str === '[object Object]') return '';
  return LOG_REASON_MAP[str]?.[lang] ?? str;
}
