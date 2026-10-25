import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product';
import { TabType } from '@/components/dashboard/Sidebar';

export type ToastType = 'success' | 'error' | 'warning';

export interface DashboardApiError {
  id: string;
  endpoint: string;
  label?: string;
  status: number;
  message: string;
  timestamp: string;
}

interface UIState {
  // Navigation
  activeTab: TabType;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  globalSearch: string;

  // Modals
  isFormModalOpen: boolean;
  editingProduct: Product | null;

  isDetailModalOpen: boolean;
  previewProduct: Product | null;

  isPublishModalOpen: boolean;
  publishTargetProduct: Product | null;

  // Toast
  toastMessage: string | null;
  toastType: ToastType;

  // API 500 / Server Errors on Dashboard
  apiErrors: DashboardApiError[];
}

const initialState: UIState = {
  activeTab: 'overview',
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  globalSearch: '',

  isFormModalOpen: false,
  editingProduct: null,

  isDetailModalOpen: false,
  previewProduct: null,

  isPublishModalOpen: false,
  publishTargetProduct: null,

  toastMessage: null,
  toastType: 'success',

  apiErrors: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<TabType>) {
      state.activeTab = action.payload;
    },

    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },

    setMobileDrawerOpen(state, action: PayloadAction<boolean>) {
      state.mobileDrawerOpen = action.payload;
    },

    setGlobalSearch(state, action: PayloadAction<string>) {
      state.globalSearch = action.payload;
    },

    openCreateModal(state) {
      state.editingProduct = null;
      state.isFormModalOpen = true;
    },

    openEditModal(state, action: PayloadAction<Product>) {
      state.editingProduct = action.payload;
      state.isFormModalOpen = true;
    },

    closeFormModal(state) {
      state.isFormModalOpen = false;
    },

    openDetailModal(state, action: PayloadAction<Product>) {
      state.previewProduct = action.payload;
      state.isDetailModalOpen = true;
    },

    closeDetailModal(state) {
      state.isDetailModalOpen = false;
    },

    openPublishModal(state, action: PayloadAction<Product>) {
      state.publishTargetProduct = action.payload;
      state.isPublishModalOpen = true;
    },

    closePublishModal(state) {
      state.isPublishModalOpen = false;
    },

    showToast(
      state,
      action: PayloadAction<string | { message: string; type?: ToastType }>
    ) {
      if (typeof action.payload === 'string') {
        state.toastMessage = action.payload;
        const lower = action.payload.toLowerCase();
        if (
          lower.includes('lỗi') ||
          lower.includes('error') ||
          lower.includes('500') ||
          lower.includes('thất bại')
        ) {
          state.toastType = 'error';
        } else {
          state.toastType = 'success';
        }
      } else {
        state.toastMessage = action.payload.message;
        state.toastType = action.payload.type || 'success';
      }
    },

    showErrorToast(state, action: PayloadAction<string>) {
      state.toastMessage = action.payload;
      state.toastType = 'error';
    },

    clearToast(state) {
      state.toastMessage = null;
      state.toastType = 'success';
    },

    setApiErrors(state, action: PayloadAction<DashboardApiError[]>) {
      state.apiErrors = action.payload;
    },

    addApiError(state, action: PayloadAction<DashboardApiError>) {
      const existingIndex = state.apiErrors.findIndex(
        (e) => e.endpoint === action.payload.endpoint || e.id === action.payload.id
      );
      if (existingIndex !== -1) {
        state.apiErrors[existingIndex] = action.payload;
      } else {
        state.apiErrors.unshift(action.payload);
      }
    },

    removeApiError(state, action: PayloadAction<string>) {
      state.apiErrors = state.apiErrors.filter(
        (e) => e.id !== action.payload && e.endpoint !== action.payload
      );
    },

    clearApiErrors(state) {
      state.apiErrors = [];
    },
  },
});

export const {
  setActiveTab,
  setSidebarCollapsed,
  setMobileDrawerOpen,
  setGlobalSearch,
  openCreateModal,
  openEditModal,
  closeFormModal,
  openDetailModal,
  closeDetailModal,
  openPublishModal,
  closePublishModal,
  showToast,
  showErrorToast,
  clearToast,
  setApiErrors,
  addApiError,
  removeApiError,
  clearApiErrors,
} = uiSlice.actions;

export default uiSlice.reducer;
