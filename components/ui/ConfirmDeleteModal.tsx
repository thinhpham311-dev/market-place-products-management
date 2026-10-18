'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icons } from './Icons';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  message: string;
  itemName?: string;
  itemSubtitle?: string;
  itemMeta?: string;
  itemImage?: string;
  itemIcon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  subtitle,
  message,
  itemName,
  itemSubtitle,
  itemMeta,
  itemImage,
  itemIcon,
  confirmLabel,
  cancelLabel,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle || t('delete_modal.subtitle')}
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {cancelLabel || t('table.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Icons.Trash2 size={15} />}
            onClick={onConfirm}
          >
            {confirmLabel || t('delete_modal.confirm_btn')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-rose-500/30">
            <Icons.AlertTriangle size={18} />
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Target Item Preview Card */}
        {(itemName || itemImage) && (
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            {itemImage ? (
              <img
                src={itemImage}
                alt={itemName || 'Preview'}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                {itemIcon || <Icons.Layers size={20} />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {itemName && (
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {itemName}
                </p>
              )}
              {itemSubtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {itemSubtitle}
                </p>
              )}
              {itemMeta && (
                <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                  {itemMeta}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
