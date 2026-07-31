import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Copy, Check, Sparkles, RefreshCw, Bookmark } from 'lucide-react';

interface AILetterDisplayProps {
  letter: string;
  onReset: () => void;
  onSaveHistory?: () => void;
  isSaved?: boolean;
}

export const AILetterDisplay: React.FC<AILetterDisplayProps> = ({
  letter,
  onReset,
  onSaveHistory,
  isSaved = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Split letter into paragraphs
  const paragraphs = letter
    .split('\n')
    .filter((p) => p.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative w-full p-6 sm:p-8 bg-[#FFFDF0] border-2 border-dashed border-[#D4C3A3] rounded-3xl shadow-sm overflow-hidden"
    >
      {/* Background soft ambient glowing circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFD93D]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FF6B6B]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#E6D5C3]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFD93D] text-[#2D2D2D] shadow-xs">
            <Heart className="w-6 h-6 fill-[#FF6B6B] text-[#FF6B6B]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2D2D2D] flex items-center gap-1.5">
              AI 마음 선생님의 답장 편지
              <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
            </h3>
            <p className="text-xs text-[#7A6B5C]">
              당신의 일기와 그림에 담긴 표현 형태와 기운을 읽고 보낸 따뜻한 응원입니다.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {onSaveHistory && (
            <button
              type="button"
              onClick={onSaveHistory}
              disabled={isSaved}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#E6D5C3]/40 text-[#7A6B5C] border-[#E6D5C3]'
                  : 'bg-white text-[#5C5246] border-[#E6D5C3] hover:bg-[#F5EBE0] shadow-2xs'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-[#FF6B6B]" />
              {isSaved ? '일기장에 저장됨' : '일기장에 저장'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#5C5246] bg-white border border-[#E6D5C3] rounded-xl hover:bg-[#F5EBE0] shadow-2xs transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#6BCB77]" />
                <span className="text-[#6BCB77]">복사완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>복사하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Letter Content Body */}
      <div className="space-y-4 text-[#3D352E] text-sm sm:text-base leading-relaxed font-sans tracking-wide">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="bg-white/90 p-5 rounded-2xl border border-[#E6D5C3]/80 shadow-2xs">
            {p}
          </p>
        ))}
      </div>

      {/* Letter Footer */}
      <div className="mt-8 pt-6 border-t border-[#E6D5C3] flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-[#7A6B5C] font-bold flex items-center gap-1.5">
          <span>🌸 언제나 당신의 소중한 마음을 지켜드릴게요.</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#FF6B6B] hover:bg-[#FF5252] rounded-xl shadow-md shadow-[#FF6B6B]/20 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          새 일기 작성하기
        </button>
      </div>
    </motion.div>
  );
};
