'use client';

import React, { useState } from 'react';
import { Product, InventoryLog } from '@/types/product';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface InventoryManagerProps {
  products: Product[];
  logs: InventoryLog[];
  onAdjustStock: (productId: string, delta: number, reason: string, type: 'in' | 'out' | 'adjustment') => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  logs,
  onAdjustStock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'logs'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Modal Adjust Stock State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Nhập lô hàng mới từ nhà cung cấp');

  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (filterStockStatus === 'low' && (p.stock > p.lowStockThreshold || p.stock === 0)) return false;
    if (filterStockStatus === 'out' && p.stock > 0) return false;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);

  const handleOpenAdjust = (product: Product, type: 'in' | 'out' = 'in') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setAdjustQty(type === 'in' ? 20 : 5);
    setAdjustReason(type === 'in' ? 'Nhập thêm hàng từ xưởng' : 'Xuất hủy / trả hàng lỗi');
  };

  const handleConfirmAdjust = () => {
    if (!selectedProduct || adjustQty <= 0) return;
    const delta = adjustType === 'out' ? -adjustQty : adjustQty;
    onAdjustStock(selectedProduct.id, delta, adjustReason, adjustType);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng số lượng tồn
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalUnits.toLocaleString()} cái
            </h3>
            <p className="text-xs text-slate-500 mt-1">Trải dài trên {products.length} sản phẩm</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <Icons.Boxes size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cảnh báo sắp hết hàng
            </span>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">
              {lowStockCount} sản phẩm
            </h3>
            <p className="text-xs text-slate-500 mt-1">Dưới ngưỡng an toàn</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
            <Icons.AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Đã hết hàng tồn
            </span>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {outOfStockCount} sản phẩm
            </h3>
            <p className="text-xs text-slate-500 mt-1">Cần tạo đơn nhập gấp</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <Icons.AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'stock'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Danh sách theo dõi tồn kho ({products.length})
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'logs'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Lịch sử nhập / xuất kho ({logs.length})
            </button>
          </div>

          {activeSubTab === 'stock' && (
            <div className="flex items-center gap-2">
              <select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value as any)}
                className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">Tất cả tình trạng tồn</option>
                <option value="low">Sắp hết hàng ({lowStockCount})</option>
                <option value="out">Hết hàng ({outOfStockCount})</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Stock list */}
        {activeSubTab === 'stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Sản phẩm</th>
                  <th className="py-3 px-4 font-semibold">Mã SKU</th>
                  <th className="py-3 px-4 font-semibold">Vị trí kho</th>
                  <th className="py-3 px-4 font-semibold">Tồn hiện tại</th>
                  <th className="py-3 px-4 font-semibold">Định mức tối thiểu</th>
                  <th className="py-3 px-4 font-semibold text-right">Điều chỉnh nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock <= p.lowStockThreshold && !isOut;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{p.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {p.sku}
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {p.warehouseLocation || 'KHO-CHÍNH'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              : isLow
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}
                        >
                          {p.stock} cái
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500">
                        ≥ {p.lowStockThreshold} cái
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleOpenAdjust(p, 'in')}
                            leftIcon={<Icons.Plus size={12} />}
                          >
                            Nhập kho
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2.5 text-slate-500"
                            onClick={() => handleOpenAdjust(p, 'out')}
                          >
                            Xuất kho
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Logs history */}
        {activeSubTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Thời gian</th>
                  <th className="py-3 px-4 font-semibold">Sản phẩm</th>
                  <th className="py-3 px-4 font-semibold">Loại giao dịch</th>
                  <th className="py-3 px-4 font-semibold">Biến động</th>
                  <th className="py-3 px-4 font-semibold">Tồn mới</th>
                  <th className="py-3 px-4 font-semibold">Lý do & Nhân viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-xs">
                    <td className="py-3 px-4 text-slate-400 font-mono">{log.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.productName}
                      <span className="block font-mono text-[10px] text-slate-400 font-normal">{log.sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type === 'in'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : log.type === 'out'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                        }`}
                      >
                        {log.type === 'in' ? 'Nhập hàng' : log.type === 'out' ? 'Xuất kho' : 'Điều chỉnh'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={log.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {log.newStock} cái
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="block text-slate-700 dark:text-slate-300 font-medium">{log.reason}</span>
                      <span className="text-[10px] text-slate-400">Người thực hiện: {log.staffName}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Adjust Modal */}
      {selectedProduct && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          title={`Điều chỉnh tồn kho: ${selectedProduct.name}`}
          description={`Mã SKU: ${selectedProduct.sku} • Tồn hiện tại: ${selectedProduct.stock} cái`}
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmAdjust} leftIcon={<Icons.Check size={16} />}>
                Xác nhận điều chỉnh
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Loại thao tác
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    adjustType === 'in'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <Icons.Plus size={14} /> Nhập thêm hàng
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('out')}
                  className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    adjustType === 'out'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <Icons.Trash2 size={14} /> Xuất bớt kho
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số lượng thay đổi (cái)
              </label>
              <input
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tồn kho sau điều chỉnh: <strong>{Math.max(0, selectedProduct.stock + (adjustType === 'out' ? -adjustQty : adjustQty))} cái</strong>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lý do điều chỉnh
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="VD: Nhập thêm từ kho tổng, Xuất trả hàng hỏng..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
