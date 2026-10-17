'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setThemeMode,
  toggleThemeMode,
  setSidebarTheme,
  ThemeMode,
  SidebarTheme,
} from '@/store/settings/themeSlice';
import { Icons } from '@/components/ui/Icons';

export function useThemeSync() {
  const mode = useAppSelector((s) => s.settings?.theme?.mode ?? 'light');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        mode === 'dark' || (mode === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (mode === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [mode]);

  return mode;
}

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.settings?.theme?.mode ?? 'light');
  const isDark = mode === 'dark';

  const handleToggle = () => {
    dispatch(toggleThemeMode());
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer ${className}`}
      title={isDark ? 'Chuyển sang chế độ Sáng (Light Mode)' : 'Chuyển sang chế độ Tối (Dark Mode)'}
      aria-label="Chuyển đổi giao diện Sáng / Tối"
    >
      {isDark ? (
        <Icons.Sun size={19} className="text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Icons.Moon size={19} className="text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? 'Chế độ Sáng' : 'Chế độ Tối'}
        </span>
      )}
    </button>
  );
};

export const ThemeSelectorCards: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentMode = useAppSelector((s) => s.settings?.theme?.mode ?? 'light');

  const options: {
    id: ThemeMode;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'light',
      label: 'Giao diện Sáng (Light)',
      desc: 'Nền sáng rõ ràng, phù hợp làm việc ban ngày',
      icon: <Icons.Sun size={20} className="text-amber-500" />,
    },
    {
      id: 'dark',
      label: 'Giao diện Tối (Dark Mode)',
      desc: 'Giảm mỏi mắt khi làm việc ban đêm hoặc thiếu sáng',
      icon: <Icons.Moon size={20} className="text-indigo-400" />,
    },
    {
      id: 'system',
      label: 'Tự động theo hệ thống',
      desc: 'Đồng bộ theo cài đặt Sáng/Tối của hệ điều hành',
      icon: <Icons.Settings size={20} className="text-emerald-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const active = currentMode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => dispatch(setThemeMode(opt.id))}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              active
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shadow-xs">
                {opt.icon}
              </div>
              {active && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Icons.Check size={12} />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {opt.label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {opt.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const SidebarThemeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentSidebarTheme = useAppSelector(
    (s) => s.settings?.theme?.sidebarTheme ?? 'adaptive'
  );

  const sidebarOptions: {
    id: SidebarTheme;
    label: string;
    desc: string;
    previewClass: string;
  }[] = [
    {
      id: 'adaptive',
      label: 'Tự động Sáng / Tối',
      desc: 'Trắng ở Light Mode, Đen ở Dark Mode',
      previewClass: 'bg-gradient-to-br from-white via-slate-100 to-slate-900 border border-slate-300',
    },
    {
      id: 'indigo',
      label: 'Xanh Indigo (Royal)',
      desc: 'Xanh tím hiện đại & nổi bật',
      previewClass: 'bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-900',
    },
    {
      id: 'emerald',
      label: 'Xanh Ngọc (Emerald)',
      desc: 'Tươi mát, dịu mắt khi vận hành lâu',
      previewClass: 'bg-gradient-to-br from-emerald-950 via-teal-800 to-slate-900',
    },
    {
      id: 'violet',
      label: 'Tím Hoàng Gia (Violet)',
      desc: 'Sang trọng với tông tím đậm',
      previewClass: 'bg-gradient-to-br from-purple-950 via-violet-800 to-fuchsia-950',
    },
    {
      id: 'slate',
      label: 'Đen Tuyền (Dark Slate)',
      desc: 'Luôn giữ màu tối cổ điển',
      previewClass: 'bg-slate-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {sidebarOptions.map((opt) => {
        const active = currentSidebarTheme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => dispatch(setSidebarTheme(opt.id))}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              active
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-7 rounded-lg shadow-inner ${opt.previewClass}`} />
              {active && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Icons.Check size={12} />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {opt.label}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {opt.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
