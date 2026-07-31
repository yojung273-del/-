import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Trash2, Heart, BookOpen } from 'lucide-react';
import { DiaryEntry } from '../types';

interface DiaryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  onDeleteEntry: (id: string) => void;
}

export const DiaryHistoryModal: React.FC<DiaryHistoryModalProps> = ({
  isOpen,
  onClose,
  entries,
  onDeleteEntry,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2D2D]/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#FFF9F5] border-2 border-[#E6D5C3] rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E6D5C3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B6B] flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#2D2D2D]">내 마음 일기장 모아보기</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-[#FFF0F0] text-[#FF6B6B] rounded-full border border-[#FFD5D5]">
                {entries.length}개 저장됨
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#7A6B5C] hover:text-[#2D2D2D] hover:bg-[#F5EBE0] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#A08E7B]">
                <Heart className="w-12 h-12 text-[#FF6B6B]/40 mb-3 stroke-1" />
                <p className="font-bold text-[#5C5246] text-base">저장된 마음 일기가 없습니다.</p>
                <p className="text-xs text-[#A08E7B] mt-1">
                  그림을 그리고 '마음 읽어주기' 후 일기장에 저장해 보세요!
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 bg-white border border-[#E6D5C3] rounded-2xl shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#F5EBE0]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#FF6B6B]" />
                      <span className="text-xs font-bold text-[#2D2D2D]">
                        {entry.createdAt}
                      </span>
                      {entry.mood && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-[#FFF0F0] text-[#FF6B6B] rounded-full border border-[#FFD5D5]">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Image */}
                    {entry.imageBase64 && (
                      <div className="md:col-span-1 rounded-xl overflow-hidden border border-[#E6D5C3] bg-[#FFF9F5] flex items-center justify-center p-2">
                        <img
                          src={entry.imageBase64}
                          alt="그린 마음 그림"
                          className="max-h-40 object-contain w-full rounded-lg"
                        />
                      </div>
                    )}

                    {/* Diary & AI Letter preview */}
                    <div className={`${entry.imageBase64 ? 'md:col-span-2' : 'md:col-span-3'} space-y-2.5`}>
                      {entry.diaryText && (
                        <div>
                          <h4 className="text-xs font-bold text-[#A08E7B] mb-1">내 일기</h4>
                          <p className="text-xs text-[#3D352E] bg-[#FFF9F5] p-3 rounded-xl border border-[#E6D5C3]/60 leading-relaxed line-clamp-3">
                            {entry.diaryText}
                          </p>
                        </div>
                      )}

                      {entry.aiLetter && (
                        <div>
                          <h4 className="text-xs font-bold text-[#FF6B6B] mb-1 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-[#FF6B6B] fill-[#FF6B6B]" /> AI 선생님의 편지
                          </h4>
                          <p className="text-xs text-[#2D2D2D] bg-[#FFFDF0] p-3 rounded-xl border border-[#D4C3A3] leading-relaxed whitespace-pre-wrap">
                            {entry.aiLetter}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
