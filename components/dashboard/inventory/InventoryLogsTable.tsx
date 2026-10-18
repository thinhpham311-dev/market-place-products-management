'use client';

import React from 'react';
import { InventoryLog } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface InventoryLogsTableProps {
  logs: InventoryLog[];
}

export const InventoryLogsTable: React.FC<InventoryLogsTableProps> = ({ logs }) => {
  const { t, tp, tlr } = useTranslation();

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_time')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_product')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_tx_type')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_delta')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_new_stock')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_reason_staff')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-xs">
              <td className="py-3 px-4 text-slate-400 font-mono">{log.date}</td>
              <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                {tp(log.productName)}
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
                  {log.type === 'in'
                    ? t('inventory.tx_in')
                    : log.type === 'out'
                    ? t('inventory.tx_out')
                    : t('inventory.tx_adjust')}
                </span>
              </td>
              <td className="py-3 px-4 font-bold">
                <span className={log.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                </span>
              </td>
              <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                {log.newStock} {t('table.stock_unit')}
              </td>
              <td className="py-3 px-4 text-slate-500">
                <span className="block text-slate-700 dark:text-slate-300 font-medium">
                  {tlr(log.reason)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t('inventory.staff_prefix')} {log.staffName}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
