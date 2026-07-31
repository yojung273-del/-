import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, BookOpen, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { DiaryForm } from './components/DiaryForm';
import { AILetterDisplay } from './components/AILetterDisplay';
import { DiaryHistoryModal } from './components/DiaryHistoryModal';
import { GASConfigModal } from './components/GASConfigModal';
import { CanvasRef, DiaryEntry, AnalyzeResponse } from './types';
import {
  getStoredGasUrl,
  saveEntryToGAS,
  fetchEntriesFromGAS,
  deleteEntryFromGAS,
} from './services/gasService';

export default function App() {
  const canvasRef = useRef<CanvasRef | null>(null);

  const [diaryText, setDiaryText] = useState('');
  const [selectedMood, setSelectedMood] = useState('기쁨');

  const [isLoading, setIsLoading] = useState(false);
  const [aiLetter, setAiLetter] = useState<string | null>(null);
  const [lastImageBase64, setLastImageBase64] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History state & GAS integration
  const [historyEntries, setHistoryEntries] = useState<DiaryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isCurrentSaved, setIsCurrentSaved] = useState(false);
  const [gasUrl, setGasUrl] = useState<string>('');
  const [gasSyncStatus, setGasSyncStatus] = useState<string>('');

  // Load history & GAS URL on mount
  useEffect(() => {
    const currentGasUrl = getStoredGasUrl();
    setGasUrl(currentGasUrl);

    // Initial load from localStorage
    try {
      const saved = localStorage.getItem('mind_diary_history');
      if (saved) {
        setHistoryEntries(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }

    // If GAS URL is set, fetch latest from Google Sheets
    if (currentGasUrl) {
      syncHistoryFromGAS(currentGasUrl);
    }
  }, []);

  const syncHistoryFromGAS = async (urlToUse?: string) => {
    setGasSyncStatus('구글 시트 동기화 중...');
    const result = await fetchEntriesFromGAS(urlToUse);
    if (result.success && result.entries) {
      setHistoryEntries(result.entries);
      try {
        localStorage.setItem('mind_diary_history', JSON.stringify(result.entries));
      } catch (e) {
        console.error(e);
      }
      setGasSyncStatus('✅ 구글 시트 동기화 완료');
      setTimeout(() => setGasSyncStatus(''), 3000);
    } else {
      setGasSyncStatus(result.error || '구글 시트 동기화 실패');
      setTimeout(() => setGasSyncStatus(''), 4000);
    }
  };

  const saveHistoryToStorage = (entries: DiaryEntry[]) => {
    try {
      localStorage.setItem('mind_diary_history', JSON.stringify(entries));
      setHistoryEntries(entries);
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);

    const imageBase64 = canvasRef.current ? canvasRef.current.getImageBase64() : '';
    const isCanvasEmpty = canvasRef.current ? canvasRef.current.isEmpty() : true;

    if (!diaryText.trim() && isCanvasEmpty) {
      setErrorMsg('마음 일기(텍스트)를 작성하거나 그림을 먼저 그려주세요!');
      return;
    }

    setIsLoading(true);
    setAiLetter(null);
    setLastImageBase64(imageBase64);
    setIsCurrentSaved(false);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diaryText: diaryText.trim(),
          imageBase64: isCanvasEmpty ? '' : imageBase64,
          mood: selectedMood,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: AnalyzeResponse;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          `API 서버 응답 오류 (${res.status}): ${
            res.status === 404
              ? '서버 API 경로를 찾을 수 없습니다. 개발 서버가 준비 중일 수 있습니다.'
              : text.slice(0, 100)
          }`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini 분석 요청에 실패했습니다.');
      }

      setAiLetter(data.letter || '');

      setTimeout(() => {
        const letterEl = document.getElementById('ai-letter-section');
        if (letterEl) {
          letterEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (err: any) {
      console.error('API Error:', err);
      setErrorMsg(err.message || 'AI 답장을 가져오는 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!aiLetter) return;

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mood: selectedMood,
      diaryText: diaryText,
      imageBase64: lastImageBase64,
      aiLetter: aiLetter,
    };

    const updated = [newEntry, ...historyEntries];
    saveHistoryToStorage(updated);
    setIsCurrentSaved(true);

    // Save to Google Sheets if GAS URL is configured
    const activeGasUrl = getStoredGasUrl();
    if (activeGasUrl) {
      setGasSyncStatus('구글 시트로 저장 중...');
      const result = await saveEntryToGAS(newEntry, activeGasUrl);
      if (result.success) {
        setGasSyncStatus('✅ 구글 시트 저장 완료!');
      } else {
        setGasSyncStatus(`❌ 구글 시트 저장 실패: ${result.error}`);
      }
      setTimeout(() => setGasSyncStatus(''), 4000);
    }
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    const updated = historyEntries.filter((item) => item.id !== id);
    saveHistoryToStorage(updated);

    const activeGasUrl = getStoredGasUrl();
    if (activeGasUrl) {
      deleteEntryFromGAS(id, activeGasUrl);
    }
  };

  const handleReset = () => {
    setDiaryText('');
    setAiLetter(null);
    setErrorMsg(null);
    setIsCurrentSaved(false);
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGasSaved = (url: string) => {
    setGasUrl(url);
    if (url) {
      syncHistoryFromGAS(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2D2D2D] font-sans antialiased pb-16">
      {/* Navbar / Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E6D5C3] shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B6B] rounded-xl flex items-center justify-center text-white text-xl shadow-xs">
              🎨
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight text-[#2D2D2D] flex items-center gap-2">
                내 마음 일기장
                <span className="text-[10px] font-bold text-[#FF6B6B] bg-[#FFF0F0] px-2 py-0.5 rounded-full border border-[#FFD5D5]">
                  Gemini AI
                </span>
              </h1>
              <p className="text-[11px] text-[#A08E7B] uppercase tracking-widest font-medium hidden sm:block">
                My Inner Heart Diary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* GAS Google Sheets Config Button */}
            <button
              type="button"
              onClick={() => setIsGasModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                gasUrl
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9] hover:bg-[#C8E6C9]'
                  : 'bg-[#FAF9F5] text-[#6B5E52] border-[#E8E2D9] hover:bg-[#F0EBE1]'
              }`}
            >
              <Database className="w-4 h-4 text-[#34A853]" />
              <span className="hidden sm:inline">
                {gasUrl ? '구글 시트 연동됨' : '구글 시트 연동'}
              </span>
              {gasUrl && <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />}
            </button>

            {/* History Modal Button */}
            <button
              type="button"
              onClick={() => {
                setIsHistoryOpen(true);
                if (gasUrl) syncHistoryFromGAS(gasUrl);
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-[#5C5246] bg-[#F5EBE0] hover:bg-[#EBE0D3] border border-[#E6D5C3] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#FF6B6B]" />
              <span>일기 모아보기</span>
              {historyEntries.length > 0 && (
                <span className="ml-0.5 px-2 py-0.5 bg-[#FF6B6B] text-white text-[10px] font-extrabold rounded-full">
                  {historyEntries.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sync Status Toast Bar */}
      {gasSyncStatus && (
        <div className="bg-[#E8F5E9] text-[#2E7D32] border-b border-[#C8E6C9] px-4 py-1.5 text-center text-xs font-semibold animate-in fade-in">
          {gasSyncStatus}
        </div>
      )}

      {/* Hero Header Greeting */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
        <div className="p-4 sm:p-6 mb-8 bg-white border-2 border-[#E6D5C3] rounded-3xl shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFD93D]/30 flex items-center justify-center shrink-0 mt-0.5 text-base">
              💡
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-[#2D2D2D]">
                오늘 당신의 마음에는 어떤 색깔과 이야기가 머물고 있나요?
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6B5C] leading-relaxed">
                왼쪽에 오늘 있었던 마음의 소리를 적어보고, 오른쪽 캔버스에 지금 나의 마음 상태를 붓과 색으로 솔직하게 그려보세요.{' '}
                <strong className="text-[#FF6B6B] font-semibold">
                  '✨ 마음 읽어주기'
                </strong>{' '}
                버튼을 누르면 다정한 AI 심리상담 교사가 그림과 일기를 함께 들여다보며 위로의 편지를 전합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert Toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-medium">
                {errorMsg}
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-700 font-bold text-xs"
              >
                닫기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-Column Interface: Left (Story) | Right (Canvas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Diary Text Entry */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#2D2D2D]">
                <span className="text-[#FF6B6B] font-black">01</span> 오늘의 이야기
              </h2>
              <span className="text-[11px] text-[#A08E7B] font-medium">
                마음속 깊은 솔직한 글쓰기
              </span>
            </div>
            <DiaryForm
              diaryText={diaryText}
              setDiaryText={setDiaryText}
              selectedMood={selectedMood}
              setSelectedMood={setSelectedMood}
            />
          </div>

          {/* Right: Drawing Canvas */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#2D2D2D]">
                <span className="text-[#FF6B6B] font-black">02</span> 마음 그리기
              </h2>
              <span className="text-[11px] text-[#A08E7B] font-medium">
                자유로운 그림으로 감정 표현하기
              </span>
            </div>
            <DrawingCanvas ref={canvasRef} />
          </div>
        </div>

        {/* Submit Action Area */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleAnalyze}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#FF6B6B] hover:bg-[#FF5252] active:scale-98 text-white px-10 py-4 rounded-full font-bold text-base sm:text-lg shadow-lg shadow-[#FF6B6B]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>AI 선생님이 마음을 깊이 읽는 중...</span>
              </>
            ) : (
              <>
                <span>✨ 마음 읽어주기 (AI 공감받기)</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </button>
          <p className="text-[11px] text-[#A08E7B] font-medium">
            🔒 입력하신 글과 그림은 안전하게 백엔드 Gemini API로 수신되어 분석 후 편지로 전해집니다.
          </p>
        </div>

        {/* Loading Overlay State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mt-10 p-8 bg-[#FFFDF0] border-2 border-dashed border-[#D4C3A3] rounded-3xl flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="relative mb-4 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#FFD93D]/30 animate-ping absolute" />
                <div className="w-14 h-14 rounded-full bg-[#FF6B6B] flex items-center justify-center text-white shadow-md relative z-10">
                  <Heart className="w-7 h-7 fill-white/80 animate-pulse" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#5C5246] mb-1">
                지혜로운 AI 마음 선생님이 편지를 다듬고 있어요
              </h3>
              <p className="text-xs text-[#8B7E6D] max-w-md leading-relaxed">
                그림의 색채와 기운, 적어주신 일기 문장에 깃든 마음에 공감하는 정성 어린 답장을 적는 중입니다...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Letter Output Result */}
        {aiLetter && !isLoading && (
          <div id="ai-letter-section" className="mt-12">
            <div className="mb-3 px-1">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#2D2D2D]">
                <span className="text-[#FF6B6B] font-black">03</span> AI 선생님의 마음 배달
              </h2>
            </div>
            <AILetterDisplay
              letter={aiLetter}
              onReset={handleReset}
              onSaveHistory={handleSaveToHistory}
              isSaved={isCurrentSaved}
            />
          </div>
        )}
      </main>

      {/* History Modal */}
      <DiaryHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={historyEntries}
        onDeleteEntry={handleDeleteHistoryEntry}
      />

      {/* GAS Config Modal */}
      <GASConfigModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onSaved={handleGasSaved}
      />
    </div>
  );
}
