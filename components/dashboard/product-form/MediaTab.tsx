'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface MediaTabProps {
  thumbnail: string;
  setThumbnail: (v: string) => void;
  images: string[];
  setImages: (v: string[]) => void;
}

export const MediaTab: React.FC<MediaTabProps> = ({
  thumbnail,
  setThumbnail,
  images,
  setImages,
}) => {
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
          Ảnh đại diện chính (Cover Thumbnail URL)
        </label>
        <input
          type="url"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
        />
      </div>

      {/* Thumbnail Preview */}
      {thumbnail && (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <img
            src={thumbnail}
            alt="Preview"
            className="w-20 h-20 rounded-xl object-cover border border-slate-300 dark:border-slate-600"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Ảnh bìa hiển thị</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Tỷ lệ khuyến nghị 1:1, dung lượng dưới 2MB</p>
          </div>
        </div>
      )}

      {/* Gallery Images */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
          Bộ sưu tập ảnh phụ (Gallery)
        </label>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Dán URL hình ảnh phụ..."
            className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleAddImage} leftIcon={<Icons.Plus size={14} />}>
            Thêm ảnh
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800"
            >
              <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icons.Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
