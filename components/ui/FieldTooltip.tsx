'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

export interface FieldTooltipProps {
  title?: string;
  description: string;
  warning?: string;
  variant?: 'warning' | 'info' | 'help';
  position?: 'top' | 'bottom' | 'right' | 'left';
  className?: string;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  title,
  description,
  warning,
  variant = 'warning',
  position = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }[position];

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-x-transparent border-t-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-y-transparent border-l-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-y-transparent border-r-transparent',
  }[position];

  // Icon based on variant
  const renderIcon = () => {
    switch (variant) {
      case 'info':
        return (
          <Icons.Info
            size={13}
            className="text-indigo-400 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors"
          />
        );
      case 'help':
        return (
          <Icons.HelpCircle
            size={13}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          />
        );
      case 'warning':
      default:
        return (
          <Icons.AlertCircle
            size={13}
            className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="Xem giải thích và cảnh báo ràng buộc"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors inline-flex items-center justify-center"
      >
        {renderIcon()}
      </button>

      {/* Tooltip Content */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50 w-64 p-3 bg-slate-900 dark:bg-slate-950 text-slate-100 text-xs rounded-xl shadow-2xl border border-slate-700/80 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto select-none`}
        >
          {/* Caret Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses}`}
            aria-hidden="true"
          />

          {/* Header */}
          {title && (
            <div className="flex items-center gap-1.5 font-bold text-white mb-1 pb-1 border-b border-slate-800 text-[11px] tracking-wide uppercase">
              {variant === 'warning' && (
                <Icons.AlertTriangle size={12} className="text-amber-400 shrink-0" />
              )}
              {variant === 'info' && (
                <Icons.Info size={12} className="text-indigo-400 shrink-0" />
              )}
              {variant === 'help' && (
                <Icons.HelpCircle size={12} className="text-slate-400 shrink-0" />
              )}
              <span>{title}</span>
            </div>
          )}

          {/* Explanation description */}
          <p className="text-[11px] leading-relaxed text-slate-300">
            {description}
          </p>

          {/* Warning / Constraint Box */}
          {warning && (
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-start gap-1.5 text-[10px] text-amber-300 leading-normal bg-amber-950/40 p-1.5 rounded-md border border-amber-800/40">
              <Icons.AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-200">Cảnh báo: </strong>
                {warning}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
