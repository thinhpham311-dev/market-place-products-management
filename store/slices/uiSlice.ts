import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types/product';
import { TabType } from '@/components/dashboard/Sidebar';

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

    showToast(state, action: PayloadAction<string>) {
      state.toastMessage = action.payload;
    },

    clearToast(state) {
      state.toastMessage = null;
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
  clearToast,
} = uiSlice.actions;

export default uiSlice.reducer;
