import { SidebarTheme } from '@/store/settings/themeSlice';
import { DashboardTranslationKey } from '@/lib/i18n/dashboard-translations';

export interface SidebarStyleConfig {
  container: string;
  headerBorder: string;
  brandTitle: string;
  brandSub: string;
  iconBtn: string;
  switcherCard: string;
  switcherTitle: string;
  switcherSub: string;
  sectionLabel: string;
  navActive: string;
  navInactive: string;
  navIconActive: string;
  navIconInactive: string;
  badgeDefault: string;
  footerCard: string;
  footerTitle: string;
  channelPill: string;
  logoutBtn: string;
}

export const SIDEBAR_THEMES: Record<SidebarTheme, SidebarStyleConfig> = {
  adaptive: {
    container:
      'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800',
    headerBorder: 'border-slate-200/80 dark:border-slate-800',
    brandTitle: 'text-slate-900 dark:text-white',
    brandSub: 'text-slate-500 dark:text-slate-400',
    iconBtn:
      'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
    switcherCard:
      'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800',
    switcherTitle: 'text-slate-900 dark:text-white',
    switcherSub: 'text-slate-500 dark:text-slate-400',
    sectionLabel: 'text-slate-400 dark:text-slate-500',
    navActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
    navInactive:
      'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/70 dark:hover:bg-slate-800/70',
    navIconActive: 'text-white',
    navIconInactive:
      'text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white',
    badgeDefault:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    footerCard:
      'bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80',
    footerTitle: 'text-slate-800 dark:text-slate-200',
    channelPill:
      'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    logoutBtn:
      'text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600/20 border-transparent hover:border-rose-500/30',
  },
  indigo: {
    container:
      'bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-950 text-indigo-100 border-r border-indigo-800/50',
    headerBorder: 'border-indigo-800/50',
    brandTitle: 'text-white',
    brandSub: 'text-indigo-300',
    iconBtn: 'text-indigo-300 hover:text-white hover:bg-indigo-800/60',
    switcherCard: 'bg-indigo-900/50 border-indigo-700/50 hover:bg-indigo-800/60',
    switcherTitle: 'text-white',
    switcherSub: 'text-indigo-300',
    sectionLabel: 'text-indigo-300/80',
    navActive: 'bg-white text-indigo-950 font-semibold shadow-lg shadow-black/20',
    navInactive: 'text-indigo-200 hover:text-white hover:bg-indigo-800/50',
    navIconActive: 'text-indigo-600',
    navIconInactive: 'text-indigo-300 group-hover:text-white',
    badgeDefault: 'bg-indigo-800/80 text-indigo-100 border border-indigo-700',
    footerCard: 'bg-indigo-950/60 border-indigo-800/60',
    footerTitle: 'text-indigo-100',
    channelPill: 'bg-indigo-900/80 text-indigo-200 border border-indigo-700/60',
    logoutBtn:
      'text-rose-300 hover:text-white hover:bg-rose-500/30 border-transparent hover:border-rose-400/40',
  },
  emerald: {
    container:
      'bg-gradient-to-b from-emerald-950 via-teal-900 to-slate-950 text-emerald-100 border-r border-emerald-800/50',
    headerBorder: 'border-emerald-800/50',
    brandTitle: 'text-white',
    brandSub: 'text-emerald-300',
    iconBtn: 'text-emerald-300 hover:text-white hover:bg-emerald-800/60',
    switcherCard: 'bg-emerald-900/50 border-emerald-700/50 hover:bg-emerald-800/60',
    switcherTitle: 'text-white',
    switcherSub: 'text-emerald-300',
    sectionLabel: 'text-emerald-300/80',
    navActive: 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30',
    navInactive: 'text-emerald-200 hover:text-white hover:bg-emerald-800/50',
    navIconActive: 'text-white',
    navIconInactive: 'text-emerald-300 group-hover:text-white',
    badgeDefault: 'bg-emerald-800/80 text-emerald-100 border border-emerald-700',
    footerCard: 'bg-emerald-950/60 border-emerald-800/60',
    footerTitle: 'text-emerald-100',
    channelPill: 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/60',
    logoutBtn:
      'text-rose-300 hover:text-white hover:bg-rose-500/30 border-transparent hover:border-rose-400/40',
  },
  violet: {
    container:
      'bg-gradient-to-b from-purple-950 via-violet-900 to-slate-950 text-violet-100 border-r border-violet-800/50',
    headerBorder: 'border-violet-800/50',
    brandTitle: 'text-white',
    brandSub: 'text-violet-300',
    iconBtn: 'text-violet-300 hover:text-white hover:bg-violet-800/60',
    switcherCard: 'bg-violet-900/50 border-violet-700/50 hover:bg-violet-800/60',
    switcherTitle: 'text-white',
    switcherSub: 'text-violet-300',
    sectionLabel: 'text-violet-300/80',
    navActive:
      'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-semibold shadow-lg shadow-fuchsia-500/30',
    navInactive: 'text-violet-200 hover:text-white hover:bg-violet-800/50',
    navIconActive: 'text-white',
    navIconInactive: 'text-violet-300 group-hover:text-white',
    badgeDefault: 'bg-violet-800/80 text-violet-100 border border-violet-700',
    footerCard: 'bg-violet-950/60 border-violet-800/60',
    footerTitle: 'text-violet-100',
    channelPill: 'bg-violet-900/80 text-violet-200 border border-violet-700/60',
    logoutBtn:
      'text-rose-300 hover:text-white hover:bg-rose-500/30 border-transparent hover:border-rose-400/40',
  },
  slate: {
    container: 'bg-slate-900 text-slate-300 border-r border-slate-800',
    headerBorder: 'border-slate-800',
    brandTitle: 'text-white',
    brandSub: 'text-slate-400',
    iconBtn: 'text-slate-400 hover:text-white hover:bg-slate-800',
    switcherCard: 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800',
    switcherTitle: 'text-white',
    switcherSub: 'text-slate-400',
    sectionLabel: 'text-slate-400',
    navActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
    navInactive: 'text-slate-400 hover:text-white hover:bg-slate-800/70',
    navIconActive: 'text-white',
    navIconInactive: 'text-slate-400 group-hover:text-white',
    badgeDefault: 'bg-slate-800 text-slate-300 border border-slate-700',
    footerCard: 'bg-slate-950/40 border-slate-800/80',
    footerTitle: 'text-slate-200',
    channelPill: 'bg-slate-800 text-slate-300 border border-slate-700',
    logoutBtn:
      'text-rose-400 hover:text-white hover:bg-rose-600/20 border-transparent hover:border-rose-500/30',
  },
};

export const COLOR_SWATCHES: {
  id: SidebarTheme;
  labelKey: DashboardTranslationKey;
  dotClass: string;
}[] = [
  {
    id: 'adaptive',
    labelKey: 'sidebar.color_adaptive',
    dotClass:
      'bg-gradient-to-tr from-white via-slate-200 to-slate-800 border border-slate-400',
  },
  { id: 'indigo', labelKey: 'sidebar.color_indigo', dotClass: 'bg-indigo-600' },
  { id: 'emerald', labelKey: 'sidebar.color_emerald', dotClass: 'bg-emerald-600' },
  { id: 'violet', labelKey: 'sidebar.color_violet', dotClass: 'bg-violet-600' },
  { id: 'slate', labelKey: 'sidebar.color_slate', dotClass: 'bg-slate-800' },
];
