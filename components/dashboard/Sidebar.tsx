'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

export type TabType = 'overview' | 'products' | 'inventory' | 'categories' | 'analytics' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  productCounts: {
    total: number;
    lowStock: number;
    categories: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  productCounts,
}) => {
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: Icons.Dashboard, badge: null },
    { id: 'products', label: 'Danh sách sản phẩm', icon: Icons.Package, badge: productCounts.total },
    { id: 'inventory', label: 'Quản lý tồn kho', icon: Icons.Boxes, badge: productCounts.lowStock > 0 ? productCounts.lowStock : null, badgeVariant: 'danger' },
    { id: 'categories', label: 'Danh mục & Nhãn', icon: Icons.Layers, badge: productCounts.categories },
    { id: 'analytics', label: 'Báo cáo doanh số', icon: Icons.BarChart3, badge: 'Mới', badgeVariant: 'primary' },
    { id: 'settings', label: 'Cài đặt gian hàng', icon: Icons.Settings, badge: null },
  ];

  const handleSelectTab = (id: TabType) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">
            <Icons.ShoppingBag size={22} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-base tracking-tight leading-tight">
                NovaShop Admin
              </span>
              <span className="text-[11px] text-slate-400">E-commerce Hub</span>
            </div>
          )}
        </div>
        
        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          <Icons.ChevronLeft
            size={18}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Close button (mobile) */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Icons.X size={20} />
        </button>
      </div>

      {/* Store Quick Switcher */}
      <div className="p-3 border-b border-slate-800/80">
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0" />
            {!collapsed && (
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-white truncate">Chi nhánh Hà Nội (Main)</p>
                <p className="text-[10px] text-slate-400 truncate">Kho tổng miền Bắc</p>
              </div>
            )}
          </div>
          {!collapsed && <Icons.ChevronDown size={14} className="text-slate-400 shrink-0" />}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quản lý bán hàng
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              } ${collapsed ? 'justify-center px-2' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== null && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : item.badgeVariant === 'primary'
                      ? 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed hover */}
              {collapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Store status footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 m-3 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">Kênh đồng bộ</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-medium">
              Hoạt động tốt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Shopee</span>
            <span className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">TikTok Shop</span>
            <span className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Web</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
