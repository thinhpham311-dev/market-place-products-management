'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ProductStatus } from '@/types/product';

interface BulkActionToolbarProps {
  selectedCount: number;
  canDeleteSelected?: boolean;
  onClearSelection: () => void;
  onUpdateStatus: (status: ProductStatus) => void;
  onBulkPublish: () => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  canDeleteSelected = true,
  onClearSelection,
  onUpdateStatus,
  onBulkPublish,
  onDeleteSelected,
  onExportSelected,
}) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200 max-w-[95vw] overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-2 border-r border-slate-700 pr-3 sm:pr-4 shrink-0">
        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-xs font-medium text-slate-300 hidden sm:inline">
          {t('bulk.selected')}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="primary"
          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
          onClick={onBulkPublish}
          leftIcon={<Icons.Rocket size={14} />}
        >
          {t('bulk.publish')} ({selectedCount})
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-8"
          onClick={() => onUpdateStatus('archived')}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5" />
          {t('bulk.archive')}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-8"
          onClick={onExportSelected}
          leftIcon={<Icons.Download size={14} />}
        >
          {t('bulk.export_excel')}
        </Button>

        {canDeleteSelected && (
          <Button
            size="sm"
            variant="danger"
            className="text-xs h-8"
            onClick={onDeleteSelected}
            leftIcon={<Icons.Trash2 size={14} />}
          >
            {t('bulk.delete')}
          </Button>
        )}
      </div>

      <button
        onClick={onClearSelection}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1 shrink-0"
        title={t('bulk.clear_selection')}
      >
        <Icons.X size={16} />
      </button>
    </div>
  );
};
