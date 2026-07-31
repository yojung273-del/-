import React from 'react';
import { Calendar, Smile, BookOpen } from 'lucide-react';
import { MoodOption } from '../types';

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'joy', emoji: '😊', label: '기쁨', color: 'text-[#FF6B6B]', bgColor: 'bg-[#FFF0F0] hover:bg-[#FFE5E5] border-[#FFD5D5]' },
  { id: 'peace', emoji: '🌿', label: '평온', color: 'text-[#6BCB77]', bgColor: 'bg-[#F0FDF4] hover:bg-[#DCFCE7] border-[#BBF7D0]' },
  { id: 'sad', emoji: '😔', label: '슬픔', color: 'text-[#4D96FF]', bgColor: 'bg-[#EFF6FF] hover:bg-[#DBEAFE] border-[#BFDBFE]' },
  { id: 'worry', emoji: '😟', label: '걱정', color: 'text-[#9333EA]', bgColor: 'bg-[#F3E8FF] hover:bg-[#E9D5FF] border-[#DDD6FE]' },
  { id: 'angry', emoji: '😡', label: '화남', color: 'text-[#E11D48]', bgColor: 'bg-[#FFF1F2] hover:bg-[#FFE4E6] border-[#FECDD3]' },
  { id: 'excited', emoji: '🌟', label: '설렘', color: 'text-[#D97706]', bgColor: 'bg-[#FEF3C7] hover:bg-[#FDE68A] border-[#FDE68A]' },
  { id: 'tired', emoji: '🥱', label: '지침', color: 'text-[#64748B]', bgColor: 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0]' },
];

interface DiaryFormProps {
  diaryText: string;
  setDiaryText: (text: string) => void;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
}

export const DiaryForm: React.FC<DiaryFormProps> = ({
  diaryText,
  setDiaryText,
  selectedMood,
  setSelectedMood,
}) => {
  const todayFormatted = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Date Header */}
      <div className="flex items-center justify-between p-3.5 bg-white border border-[#E6D5C3] rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 text-[#5C5246] font-bold text-xs sm:text-sm">
          <Calendar className="w-4 h-4 text-[#FF6B6B]" />
          <span>{todayFormatted}</span>
        </div>
        <span className="text-[11px] font-bold text-[#A08E7B] bg-[#F5EBE0] px-3 py-1 rounded-full border border-[#E6D5C3]/60">
          오늘의 기록
        </span>
      </div>

      {/* Mood Selector */}
      <div className="flex flex-col gap-2.5 p-4 bg-white border border-[#E6D5C3] rounded-2xl shadow-2xs">
        <label className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
          <Smile className="w-4 h-4 text-[#FF6B6B]" />
          오늘 나의 마음 표식은 어떤가요?
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood === mood.label;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(mood.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#FF6B6B] ring-offset-1 font-extrabold shadow-xs bg-[#FF6B6B] text-white border-[#FF6B6B]'
                    : `${mood.bgColor} ${mood.color}`
                }`}
              >
                <span className="text-base">{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diary Text Area */}
      <div className="flex flex-col gap-2 p-4 bg-white border-2 border-[#E6D5C3] rounded-3xl shadow-sm">
        <label className="text-xs font-bold text-[#2D2D2D] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#FF6B6B]" />
            마음속 이야기를 글로 자유롭게 풀어내세요
          </span>
          <span className="text-[10px] font-bold text-[#A08E7B] bg-[#F5EBE0] px-2.5 py-1 rounded-md">
            {diaryText.length} 자
          </span>
        </label>
        <textarea
          rows={7}
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="오늘 하루 동안 속상했거나, 행복했거나, 누구에게도 말하지 못했던 마음의 이야기들을 마음껏 적어보세요..."
          className="w-full p-4 text-sm text-[#4A443F] placeholder-[#A08E7B]/70 bg-[#FFF9F5]/60 border border-[#E6D5C3] rounded-2xl focus:outline-none focus:border-[#FF6B6B] focus:bg-white transition-all resize-none leading-relaxed"
        />
      </div>
    </div>
  );
};
